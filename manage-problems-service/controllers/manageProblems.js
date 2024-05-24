const { Problems, Executions } = require('../models/init-models');

exports.showProblems = async (req, res) => {
    try {
        // Fetch all problems with their related executions if needed
        const problems = await Problems.findAll({
            include: [{
                model: Executions,
                as: 'executions' // Ensure that 'executions' is correctly set as an alias in your model association
            }]
        });
        res.json(problems);
    } catch (error) {
        console.error('Failed to retrieve problems:', error);
        res.status(500).json({ message: 'Failed to retrieve problems', error: error.message });
    }
};

exports.getExecutionStatus = async (req, res) => {
    try {
        const { executionId } = req.params;
        // Fetch the specific execution details
        const execution = await Executions.findByPk(executionId, {
            include: [{
                model: Problems,
                as: 'problem' // Ensure that 'problem' is correctly set as an alias in your model association
            }]
        });
        if (!execution) {
            return res.status(404).json({ message: "Execution not found" });
        }
        res.json(execution);
    } catch (error) {
        console.error('Failed to retrieve execution status:', error);
        res.status(500).json({ message: 'Failed to retrieve execution status', error: error.message });
    }
};
