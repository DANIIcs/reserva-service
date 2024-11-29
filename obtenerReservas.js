const AWS = require('aws-sdk');

exports.handler = async () => {
    console.log('Obteniendo todas las reservas');

    try {
        // Validar variables de entorno
        if (!process.env.TABLE_NAME_RESERVA) {
            return {
                statusCode: 500,
                status: 'Internal Server Error - Variable de entorno TABLE_NAME_RESERVA no configurada',
            };
        }

        const tablaReservas = process.env.TABLE_NAME_RESERVA;

        // Escanear todas las reservas en DynamoDB
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const params = { TableName: tablaReservas };

        const result = await dynamodb.scan(params).promise();

        // Respuesta exitosa
        return {
            statusCode: 200,
            message: 'Reservas obtenidas exitosamente',
            reservas: result.Items,
        };
    } catch (error) {
        console.error(`Error inesperado: ${error.message}`);
        return {
            statusCode: 500,
            status: 'Internal Server Error - Error al obtener las reservas',
            error: error.message,
        };
    }
};
