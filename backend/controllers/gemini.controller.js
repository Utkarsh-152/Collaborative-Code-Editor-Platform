import * as gemini from "../services/gemini.service.js";

export const getResponse = async (req, res) => {
    try {
        const { prompt } = req.body;
        const content = await gemini.generateContent(prompt);
        res.json({ content });
    } catch (error) {
        res.status(500).json({ error: "Failed to generate content" });
    }
}