const amqp = require('amqplib/callback_api');
const axios = require('axios');
const RABBITMQ_URL = 'amqp://myuser:mypassword@rabbitmq:5672';

// In-memory store for execution updates (this will be shared across the service)
const executionUpdates = {};

function consumeExecutionUpdates() {
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

            const queue = 'frontend_updates_queue'; // Queue for execution updates

            // Ensure the queue exists and is durable
            channel.assertQueue(queue, { durable: true });

            console.log(`[*] Waiting for messages in queue: ${queue}`);

            // Consume messages from the queue
            channel.consume(queue, async (msg) => {
                if (msg !== null) {
                    const content = msg.content.toString();
                    const message = JSON.parse(content);

                    console.log(`Received execution update: ${content}`);

                    const { executionId, status, progress, result, metaData } = message;

                    try {
                        // Send an HTTP request to update the page data
                        await axios.post(`http://front_end_service:4007/update/${executionId}`, {
                            status,
                            progress,
                            result,
                            metaData
                        });
                        console.log(`Update sent for executionId: ${executionId}`);
                    } catch (error) {
                        console.error(`Failed to update page for executionId: ${executionId}`, error);
                    }


                    channel.ack(msg);
                }
            });
        });
    });
}

module.exports = { consumeExecutionUpdates, executionUpdates }; // Export the in-memory store
