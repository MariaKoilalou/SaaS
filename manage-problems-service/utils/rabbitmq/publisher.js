const amqp = require('amqplib/callback_api');

const RABBITMQ_URL = 'amqp://myuser:mypassword@rabbitmq:5672';

// Function to send execution updates to RabbitMQ
function sendExecutionUpdateToQueue(executionId, update) {
    amqp.connect(RABBITMQ_URL, (err, connection) => {
        if (err) {
            console.error('Failed to connect to RabbitMQ:', err);
            throw err;
        }

        connection.createChannel((err, channel) => {
            if (err) {
                console.error('Failed to create channel:', err);
                throw err;
            }

            const queue = 'frontend_updates_queue'; // Common queue for execution updates

            channel.assertQueue(queue, { durable: true });

            // Construct the message
            const message = {
                executionId,
                ...update
            };

            const msg = JSON.stringify(message);

            channel.sendToQueue(queue, Buffer.from(msg), { persistent: true });
            console.log(` [x] Sent execution update ${msg} to ${queue}`);

            // Close the connection after sending the message
            setTimeout(() => {
                connection.close();
            }, 500);
        });
    });
}

module.exports = { sendExecutionUpdateToQueue };
