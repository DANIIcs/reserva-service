const express = require('express');
const AWS = require('aws-sdk');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

AWS.config.update({ region: 'us-east-1' });
const dynamoDb = new AWS.DynamoDB.DocumentClient();

// Función para validar el token llamando a la Lambda "ValidarTokenAcceso"
const validateToken = async (tenant_id, token) => {
    const lambda = new AWS.Lambda();
    const params = {
        FunctionName: 'ValidarTokenAcceso',
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({ tenant_id, token })
    };

    try {
        const response = await lambda.invoke(params).promise();
        const result = JSON.parse(response.Payload);

        if (result.statusCode !== 200) {
            throw new Error(result.body || 'Token inválido');
        }
        return true; // Token válido
    } catch (error) {
        throw new Error(`Error al validar el token: ${error.message}`);
    }
};

// Endpoint para crear una nueva reserva
app.post('/reserva', async (req, res) => {
    const { tenant_id, ID_reserva, numero_asientos, fecha, monto, metodo, fecha_pago } = req.body;
    const token = req.headers['authorization']; // Token en el header Authorization

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized - Falta el token de autorización' });
    }

    try {
        // Validar el token antes de procesar la solicitud
        await validateToken(tenant_id, token);

        const params = {
            TableName: 'Reserva',
            Item: {
                tenant_id,
                ID_reserva,
                numero_asientos,
                fecha,
                monto,
                metodo,
                fecha_pago
            }
        };

        await dynamoDb.put(params).promise();
        res.status(201).json({
            message: 'Reserva creada exitosamente',
            reserva: params.Item
        });
    } catch (error) {
        const statusCode = error.message.includes('Token') ? 403 : 500;
        res.status(statusCode).json({ error: error.message });
    }
});

// Endpoint para obtener una reserva por tenant_id y ID_reserva
app.get('/reserva/:tenant_id/:ID_reserva', async (req, res) => {
    const { tenant_id, ID_reserva } = req.params;
    const token = req.headers['authorization']; // Token en el header Authorization

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized - Falta el token de autorización' });
    }

    try {
        // Validar el token antes de procesar la solicitud
        await validateToken(tenant_id, token);

        const params = {
            TableName: 'Reserva',
            Key: {
                tenant_id,
                ID_reserva
            }
        };

        const result = await dynamoDb.get(params).promise();
        if (result.Item) {
            res.json({ reserva: result.Item });
        } else {
            res.status(404).json({ error: 'Reserva no encontrada' });
        }
    } catch (error) {
        const statusCode = error.message.includes('Token') ? 403 : 500;
        res.status(statusCode).json({ error: error.message });
    }
});

// Endpoint para actualizar una reserva
app.put('/reserva/:tenant_id/:ID_reserva', async (req, res) => {
    const { tenant_id, ID_reserva } = req.params;
    const { numero_asientos, fecha, monto, metodo, fecha_pago } = req.body;
    const token = req.headers['authorization']; // Token en el header Authorization

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized - Falta el token de autorización' });
    }

    try {
        // Validar el token antes de procesar la solicitud
        await validateToken(tenant_id, token);

        const params = {
            TableName: 'Reserva',
            Key: { tenant_id, ID_reserva },
            UpdateExpression: 'set numero_asientos = :numero_asientos, fecha = :fecha, monto = :monto, metodo = :metodo, fecha_pago = :fecha_pago',
            ExpressionAttributeValues: {
                ':numero_asientos': numero_asientos,
                ':fecha': fecha,
                ':monto': monto,
                ':metodo': metodo,
                ':fecha_pago': fecha_pago
            },
            ReturnValues: 'UPDATED_NEW'
        };

        const result = await dynamoDb.update(params).promise();
        res.json({
            message: 'Reserva actualizada',
            updatedAttributes: result.Attributes
        });
    } catch (error) {
        const statusCode = error.message.includes('Token') ? 403 : 500;
        res.status(statusCode).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
