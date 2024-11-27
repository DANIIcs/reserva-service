const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const RESERVA_TABLE = process.env.TABLE_NAME_RESERVA;

exports.handler = async () => {
    try {
        const params = { TableName: RESERVA_TABLE };
        const result = await dynamodb.scan(params).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({ reservas: result.Items }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error al obtener las reservas' }),
        };
    }
};
