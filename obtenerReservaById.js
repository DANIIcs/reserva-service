const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const RESERVA_TABLE = process.env.TABLE_NAME_RESERVA;

exports.handler = async (event) => {
    try {
        const { tenant_id, ID_reserva } = event.pathParameters;

        const params = {
            TableName: RESERVA_TABLE,
            Key: { tenant_id, ID_reserva },
        };

        const result = await dynamodb.get(params).promise();

        if (!result.Item) {
            return { statusCode: 404, body: JSON.stringify({ message: 'Reserva no encontrada' }) };
        }

        return { statusCode: 200, body: JSON.stringify({ reserva: result.Item }) };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error al obtener la reserva' }),
        };
    }
};
