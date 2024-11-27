const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const RESERVA_TABLE = process.env.TABLE_NAME_RESERVA;

exports.handler = async (event) => {
    try {
        const { tenant_id, ID_reserva } = event.pathParameters;
        const data = JSON.parse(event.body);

        const params = {
            TableName: RESERVA_TABLE,
            Key: { tenant_id, ID_reserva },
            UpdateExpression: 'set numero_asientos = :numero_asientos, fecha = :fecha, monto = :monto, metodo = :metodo, fecha_pago = :fecha_pago',
            ExpressionAttributeValues: {
                ':numero_asientos': data.numero_asientos,
                ':fecha': data.fecha,
                ':monto': data.monto,
                ':metodo': data.metodo,
                ':fecha_pago': data.fecha_pago,
            },
            ReturnValues: 'UPDATED_NEW',
        };

        const result = await dynamodb.update(params).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Reserva actualizada', updatedAttributes: result.Attributes }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error al actualizar la reserva' }),
        };
    }
};
