const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const RESERVA_TABLE = process.env.TABLE_NAME_RESERVA;

exports.handler = async (event) => {
    try {
        const { tenant_id, ID_reserva } = JSON.parse(event.body);

        if (!tenant_id || !ID_reserva) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'tenant_id y ID_reserva son obligatorios' }),
            };
        }

        const params = {
            TableName: RESERVA_TABLE,
            Key: { tenant_id, ID_reserva },
        };

        await dynamodb.delete(params).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Reserva eliminada con éxito' }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error al eliminar la reserva' }),
        };
    }
};
