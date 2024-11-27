const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const uuid = require('uuid'); // Para generar ID únicos si es necesario

const RESERVA_TABLE = process.env.TABLE_NAME_RESERVA;

exports.handler = async (event) => {
    try {
        const token = event.headers.Authorization.split(' ')[1];
        const authPayload = await verifyToken(token);

        if (!authPayload) {
            return {
                statusCode: 403,
                body: JSON.stringify({ message: 'Token inválido o expirado' }),
            };
        }

        const data = JSON.parse(event.body);
        const item = {
            tenant_id: data.tenant_id,
            ID_reserva: data.ID_reserva || uuid.v4(),
            numero_asientos: data.numero_asientos,
            fecha: data.fecha,
            monto: data.monto,
            metodo: data.metodo,
            fecha_pago: data.fecha_pago,
        };

        await dynamodb.put({
            TableName: RESERVA_TABLE,
            Item: item,
        }).promise();

        return {
            statusCode: 201,
            body: JSON.stringify({ message: 'Reserva creada con éxito', reserva: item }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error al crear la reserva' }),
        };
    }
};

async function verifyToken(token) {
    try {
        const secret = process.env.JWT_SECRET;
        const payload = jwt.verify(token, secret);
        return payload;
    } catch (error) {
        return null;
    }
}
