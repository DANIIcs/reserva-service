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

        // Obtener parámetros
        const { tenant_id, ID_reserva } = event.pathParameters || {};

        // Validar que los datos requeridos estén presentes
        if (!tenant_id || !ID_reserva) {
            return {
                statusCode: 400,
                status: 'Bad Request - tenant_id e ID_reserva son obligatorios',
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

        // Proceso - Obtener la reserva en DynamoDB
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const params = {
            TableName: tablaReservas,
            Key: { tenant_id, ID_reserva },
        };

        const result = await dynamodb.get(params).promise();

        if (!result.Item) {
            return {
                statusCode: 404,
                status: 'Not Found - Reserva no encontrada',
            };
        }

        // Respuesta exitosa
        return {
            statusCode: 200,
            message: 'Reserva obtenida exitosamente',
            reserva: result.Item,
        };
    } catch (error) {
        console.error(`Error inesperado: ${error.message}`);
        return {
            statusCode: 500,
            status: 'Internal Server Error - Error al obtener la reserva',
            error: error.message,
        };
    }
};
