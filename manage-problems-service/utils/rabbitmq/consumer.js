const amqp = require('amqplib/callback_api');
const sequelize = require('../database');
const initModels = require("../../models/init-models");
const models = initModels(sequelize);
const { sendExecutionUpdateToQueue } = require('./publisher');  // Import the publisher

const RABBITMQ_URL = 'amqp://myuser:mypassword@rabbitmq:5672';

function consumeMessagesFromQueue(executionId) {
    const queue = `execution_updates_${executionId}`;

    amqp.connect(RABBITMQ_URL, (err, connection) => {
        if (err) {
            console.error('Failed to connect to RabbitMQ:', err);
            console.log('Retrying connection in 5 seconds...');
            return setTimeout(() => consumeMessagesFromQueue(executionId), 5000); // Retry after 5 seconds
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
                        // Fetch existing execution entry
                        const execution = await models.Execution.findByPk(executionId);

                        if (!execution) {
                            console.error(`Execution with ID ${executionId} not found`);
                            return;
                        }

                        // Update execution fields with partial data
                        if (status) execution.status = status;
                        if (progress) execution.progress = progress;
                        if (result) execution.result = result;

                        // Merge new metaData with existing metaData
                        if (metaData) {
                            execution.metaData = {
                                ...execution.metaData,
                                ...metaData
                            };
                        }

                        // If the execution is completed, update the endTime and executionTime
                        if (status === 'completed' || status === 'failed') {
                            const endTime = new Date();
                            execution.endTime = endTime;

                            // Calculate the execution time in seconds
                            if (execution.startTime) {
                                const executionTime = (endTime - new Date(execution.startTime)) / 1000; // Convert to seconds
                                execution.executionTime = executionTime;
                                console.log(`Execution ${executionId} completed in ${executionTime} seconds.`);
                            }
                        }

                        // Save updated execution to the database
                        await execution.save();
                        console.log(`Execution ${executionId} updated with status: ${status}`);

                        // Publish the updated execution to the frontend queue using the publisher
                        const update = { status, progress, result, metaData, executionTime: execution.executionTime, endTime: execution.endTime };
                        sendExecutionUpdateToQueue(executionId, update);  // Call the publisher here

                        // Acknowledge the message after processing
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
