const AWS = require('aws-sdk');

exports.handler = async (event) => {
    console.log(event);

    try {
        // Validar las variables de entorno
        if (!process.env.TABLE_NAME_RESERVA || !process.env.LAMBDA_VALIDAR_TOKEN) {
            return {
                statusCode: 500,
                status: 'Internal Server Error - Variables de entorno no configuradas',
            };
        }

        const tablaReservas = process.env.TABLE_NAME_RESERVA;
        const lambdaToken = process.env.LAMBDA_VALIDAR_TOKEN;

        // Analizar el cuerpo de la solicitud
        let body = event.body || {};
        if (typeof body === 'string') {
            body = JSON.parse(body);
        }

        // Obtener el tenant_id y otros datos
        const tenant_id = body.tenant_id;
        const numero_asientos = body.numero_asientos;
        const fecha = body.fecha;
        const monto = body.monto;
        const metodo = body.metodo;
        const fecha_pago = body.fecha_pago;

        // Validar que los datos requeridos estén presentes
        if (!tenant_id || !numero_asientos || !fecha || !monto || !metodo || !fecha_pago) {
            return {
                statusCode: 400,
                status: 'Bad Request - Faltan datos en la solicitud',
            };
        }

        // Proteger el Lambda
        const token = event.headers?.Authorization;
        if (!token) {
            return {
                statusCode: 401,
                status: 'Unauthorized - Falta el token de autorización',
            };
        }

        // Invocar otro Lambda para validar el token
        const lambda = new AWS.Lambda();
        const payloadString = JSON.stringify({
            tenant_id,
            token,
        });

        const invokeResponse = await lambda.invoke({
            FunctionName: lambdaToken,
            InvocationType: 'RequestResponse',
            Payload: payloadString,
        }).promise();

        const response = JSON.parse(invokeResponse.Payload);
        console.log(response);

        if (response.statusCode === 403) {
            return {
                statusCode: 403,
                status: 'Forbidden - Acceso NO Autorizado',
            };
        }

        // Proceso - Guardar la reserva en DynamoDB
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const item = {
            tenant_id,
            ID_reserva: body.ID_reserva || require('uuid').v4(),
            numero_asientos,
            fecha,
            monto,
            metodo,
            fecha_pago,
        };

        await dynamodb.put({
            TableName: tablaReservas,
            Item: item,
        }).promise();

        // Salida (json)
        return {
            statusCode: 201,
            message: 'Reserva creada exitosamente',
            reserva: item,
        };
    } catch (error) {
        console.error(`Error inesperado: ${error.message}`);
        return {
            statusCode: 500,
            status: 'Internal Server Error - Error al crear la reserva',
            error: error.message,
        };
    }
};
