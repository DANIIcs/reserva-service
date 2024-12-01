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

        // Analizar el cuerpo de la solicitud
        const body = JSON.parse(event.body || '{}');
        const tenant_id = body.tenant_id;
        const ID_reserva = body.ID_reserva;

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

        // Proceso - Eliminar la reserva en DynamoDB
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        await dynamodb.delete({
            TableName: tablaReservas,
            Key: { tenant_id, ID_reserva },
        }).promise();

        // Respuesta exitosa
        return {
            statusCode: 200,
            message: 'Reserva eliminada exitosamente',
        };
    } catch (error) {
        console.error(`Error inesperado: ${error.message}`);
        return {
            statusCode: 500,
            status: 'Internal Server Error - Error al eliminar la reserva',
            error: error.message,
        };
    }
};
