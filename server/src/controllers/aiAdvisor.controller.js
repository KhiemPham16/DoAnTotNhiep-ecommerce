const aiAdvisorService = require('~/services/aiAdvisor.service');

class AiAdvisorController {
    async advise(req, res, next) {
        try {
            const { message, history = [] } = req.body;

            if (!message?.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng nhập nội dung cần tư vấn'
                });
            }

            const answer = await aiAdvisorService.advise(message.trim(), history);

            return res.status(200).json({
                success: true,
                data: answer
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AiAdvisorController();
