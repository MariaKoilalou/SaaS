const amqp = require('amqplib/callback_api');
const axios = require('axios'); // To send HTTP requests to Browse Problems Service and Frontend Service
const sequelize = require('../database');
const initModels = require("../../models/init-models");
const models = initModels(sequelize);

const RABBITMQ_URL = 'amqp://myuser:mypassword@rabbitmq:5672';
const BROWSE_PROBLEMS_SERVICE_URL = 'http://browse_problems_service:4003/update'; // Base URL for Browse Problems Service
const FRONTEND_SERVICE_URL = 'http://frontend_service:4007/execution/update'; // URL for updating the frontend

function consumeMessagesFromQueue(problemId, executionId) {
    const queue = `execution_updates_${executionId}`; // Dynamic queue based on execution ID

    amqp.connect(RABBITMQ_URL, (err, connection) => {
        if (err) {
            console.error('Failed to connect to RabbitMQ:', err);
            console.log('Retrying connection in 5 seconds...');
            return setTimeout(() => consumeMessagesFromQueue(problemId, executionId), 5000); // Retry after 5 seconds
        }

        connection.createChannel((err, channel) => {
            if (err) {
                console.error('Failed to create channel:', err);
                throw err;
            }

            // Ensure the queue exists and is durable
            channel.assertQueue(queue, { durable: true });

            console.log(` [*] Waiting for messages in queue: ${queue}. To exit press CTRL+C`);

            // Consume messages from the queue
            channel.consume(queue, async (msg) => {
                if (msg !== null) {
                    const content = msg.content.toString();
                    const message = JSON.parse(content);

                    console.log(` [x] Received message: ${content}`);

                    const { status, progress, result, metaData } = message;

                    try {
                        // Update the execution status, progress, and result in the Manage Problem Service database
                        await models.Execution.update({
                            status,
                            progress: progress || null,
                            result: result || null,
                            metaData: metaData || null
                        }, {
                            where: { id: executionId }
                        });

                        console.log(`Execution ${executionId} updated with status: ${status}`);

                        // 1. Inform Browse Problems Service about the update
                        const browseProblemsUpdateUrl = `${BROWSE_PROBLEMS_SERVICE_URL}/${problemId}`;
                        await axios.post(browseProblemsUpdateUrl, {
                            status: status,
                            progress: progress,
                            result: result
                        });
                        console.log(`Problem ${problemId} status updated in Browse Problems Service.`);

                        // 2. Inform Frontend Service about the update
                        await axios.post(FRONTEND_SERVICE_URL, {
                            executionId,
                            status,
                            progress,
                            result,
                            metaData
                        });
                        console.log(`Execution ${executionId} status updated in Frontend Service.`);

                        // Acknowledge the message after it's processed
                        channel.ack(msg);
                    } catch (updateError) {
                        console.error(`Failed to update execution ${executionId}:`, updateError);
                    }
                }
            });
        });
    });
}

module.exports = { consumeMessagesFromQueue };
