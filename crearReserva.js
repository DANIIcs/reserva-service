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
        const tenant_id_prog = body.tenant_id_prog;
        const ord_prog = body.ord_prog;
        const numero_asientos = body.numero_asientos;
        const reserva_ord = new Date().toISOString();
        const monto = body.monto;
        const metodo = body.metodo;

        // Validar que los datos requeridos estén presentes
        if (!tenant_id_prog || !numero_asientos || !reserva_ord || !monto || !metodo || !ord_prog) {
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

        const tenant_id = tenant_id_prog.split('#')[0];
        console.log(tenant_id)

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

        // Concatenar las variables
        const tenant_reserva_id = `${tenant_id_prog}#${ord_prog}`;
        console.log(tenant_id);

        // Proceso - Guardar la reserva en DynamoDB
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const item = {
            tenant_reserva_id,
            reserva_ord,
            numero_asientos,
            monto,
            metodo,
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
