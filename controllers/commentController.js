import Comment from '../models/Comment.js';

/**
 * Busca comentários pendentes com paginação.
 * @param {number} page - Página atual para paginação.
 * @param {number} limit - Quantidade de comentários por página.
 * @returns {Promise<Array>} Lista de comentários pendentes.
 * @throws {Error} Se ocorrer erro ao buscar comentários.
 */
export const getPendingComments = async (page = 1, limit = 10) => {
    try {
        const comments = await Comment.find({ status: 'pending' })
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 }); // Ordenação do mais recente para o mais antigo
        return comments;
    } catch (error) {
        throw new Error('Erro ao buscar comentários pendentes');
    }
};

/**
 * Aprova um comentário pelo ID.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const approveComment = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedComment = await Comment.findByIdAndUpdate(id, { status: 'approved' }, { new: true });

        if (!updatedComment) {
            return res.status(404).json({ message: 'Comentário não encontrado' });
        }

        res.json({ message: 'Comentário aprovado com sucesso', comment: updatedComment });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao aprovar comentário', error: error.message });
    }
};

/**
 * Deleta um comentário pelo ID.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const deleteComment = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedComment = await Comment.findByIdAndDelete(id);

        if (!deletedComment) {
            return res.status(404).json({ message: 'Comentário não encontrado' });
        }

        res.json({ message: 'Comentário excluído com sucesso' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao excluir comentário', error: error.message });
    }
};
