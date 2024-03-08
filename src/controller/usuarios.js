const knex = require('../connection')
const bcrypt = require('bcrypt');

const cadastrarUsuario = async (req, res) => {
    const { username, senha } = req.body;

    if (!username) {
        return res.status(404).json("O campo username é obrigatório");
    }

    if (!senha) {
        return res.status(404).json("O campo senha é obrigatório");
    }

    if (senha.length < 5) {
        return res.status(404).json("A senha ddeve conter, no minimo 5 caracteres.");
    }

    try {        
        const quantidadeUsuarios = await knex('usuarios').where({username}).first()
        
        if (quantidadeUsuarios) {
            return res.status(400).json("O username informado já existe");
        }

        const senhaCriptografada = await bcrypt.hash(senha, 10);
        
        const usuario = await knex('usuarios').insert({
            username,
            senha: senhaCriptografada
        }).returning('*').debug();

        if (!usuario) {
            return res.status(400).json("O usuário não foi cadastrado.");
        }
        
        return res.status(200).json(usuario);
    } catch (error) {
        return res.status(400).json(error.message);
    }
}

const obterPerfil = async (req, res) => {
    return res.status(200).json(req.usuario);
}

const atualizarPerfil = async (req, res) => {
    let { nome, email, senha, username, site, bio, telefone, genero } = req.body;
    const {id} = req.usuario

    if (!nome && !email && !senha && !nome_loja && !username && !site && !bio && !telefone && !genero) {
        return res.status(404).json('É obrigatório informar ao menos um campo para atualização');
    }

    try {
        if (senha) {
            if(senha.length < 5){
                return res.status(404).json("A senha ddeve conter, no minimo 5 caracteres.");
            }
            senha = await bcrypt.hash(senha, 10);
        }

        if (email !== req.usuario.email) {
                const emailUsuarioExistente = await knex('usuarios').where({email}).first();

                if (emailUsuarioExistente) {
                    return res.status(400).json("O email já existe");
                }
        }
 

        if (username !== req.usuario.username) {
            const usernameUsuarioExistente = await knex('usuarios').where({username}).first();

            if(usernameUsuarioExistente){
                return res.status(400).json("O username já existe");
            }
        }

        const usuarioAtualizado = await knex('usuarios').where({id}).update({nome, 
            email, 
            senha, 
            username, 
            site, 
            bio, 
            telefone, 
            genero }).returning('*');

        if (!usuarioAtualizado) {
            return res.status(400).json("O usuario não foi atualizado");
        }

        return res.status(200).json('Usuario foi atualizado com sucesso.');
    } catch (error) {
        return res.status(400).json(error.message);
    }
}

module.exports = {
    cadastrarUsuario,
    obterPerfil,
    atualizarPerfil
}