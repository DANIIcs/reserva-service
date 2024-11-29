const AWS = require('aws-sdk');

exports.handler = async (event) => {
    console.log(event);

    try {
        // Validar variables de entorno
        if (!process.env.TABLE_NAME_RESERVA || !process.env.LAMBDA_VALIDAR_TOKEN) {
            return {
                statusCode: 500,
                status: 'Internal Server Error - Variables de entorno no configuradas',
            };
        }

        const tablaReservas = process.env.TABLE_NAME_RESERVA;
        const lambdaToken = process.env.LAMBDA_VALIDAR_TOKEN;

        // Obtener parámetros y datos del cuerpo
        const { tenant_id, ID_reserva } = event.pathParameters || {};
        const body = JSON.parse(event.body || '{}');

        // Validar que los datos requeridos estén presentes
        if (!tenant_id || !ID_reserva || !body.numero_asientos || !body.fecha || !body.monto || !body.metodo || !body.fecha_pago) {
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

        // Proceso - Actualizar la reserva en DynamoDB
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const params = {
            TableName: tablaReservas,
            Key: { tenant_id, ID_reserva },
            UpdateExpression:
                'set numero_asientos = :numero_asientos, fecha = :fecha, monto = :monto, metodo = :metodo, fecha_pago = :fecha_pago',
            ExpressionAttributeValues: {
                ':numero_asientos': body.numero_asientos,
                ':fecha': body.fecha,
                ':monto': body.monto,
                ':metodo': body.metodo,
                ':fecha_pago': body.fecha_pago,
            },
            ReturnValues: 'UPDATED_NEW',
        };

        const result = await dynamodb.update(params).promise();

        // Respuesta exitosa
        return {
            statusCode: 200,
            message: 'Reserva actualizada exitosamente',
            updatedAttributes: result.Attributes,
        };
    } catch (error) {
        console.error(`Error inesperado: ${error.message}`);
        return {
            statusCode: 500,
            status: 'Internal Server Error - Error al modificar la reserva',
            error: error.message,
        };
    }
};
