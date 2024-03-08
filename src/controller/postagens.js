const knex = require('../connection');

const novaPostagem = async (req, res) =>{
    const {id} = req.usuario;
    const {texto, fotos} = req.body;

    if(!fotos || fotos.length === 0){
        return res.status(404).json('É preciso informar ao menos uma foto');
    };

    try {
        const postagem = await knex('postagens').insert({texto, usuario_id: id}).returning('*');
        
        if(!postagem){
            return res.status(404).json('Não foi possivel concluir a postagem');
        };

        for (const foto of fotos) {
            foto.postagem_id = postagem[0].id;
        };

        const fotoCadastrada = await knex('postagens_fotos').insert(fotos);

        if(!fotoCadastrada){
            await knex('postagem').where({id: postagem[0].id}).del();
            return res.status(404).json('Não foi possivel concluir a postagem');
        }

        return res.status(200).json('Postagem realizada com sucesso!');
    } catch (error) {
        return res.status(400).json(error.menssage);
    };
};

const curtir = async (req, res) =>{
    const {id} = req.usuario;
    const {postagemId} = req.params

    try {
        const postagem = await knex('postagens').where({id:postagemId}).first();

        if(!postagem){
            return res.status(404).json('Postagem não encontrada');
        }

        const jaCurtiu = await knex('postagens_curtidas').where({usuario_id: id, postagem_id: postagem.id}).first();

        if(jaCurtiu){
            return res.status(404).json('O usuario já curtiu essa postagem');
        };

        const curtida = await knex('postagens_curtidas').insert({
            usuario_id: id, 
            postagem_id: postagem.id 
        });

        if(!curtida){
            return res.status(400).json('Não foi possivel curtir essa postagem');
        }

        return res.status(200).json('Postagem curtida com sucesso.');
    } catch (error) {
        return res.status(400).json(error.menssage);
    }
}


const comentar = async (req, res) =>{
    const {id} = req.usuario;
    const {postagemId} = req.params
    const {texto} = req.body

    if(!texto){
        return res.status(404).json('Para comentar nessa postagem é necessário informar o texto.');
    }

    try{
        const postagem = await knex('postagens').where({id: postagemId}).first();

        if(!postagem){
            return res.status(404).json('Postagem não encontrada');
        }

        const comentar = await knex('postagens_comentarios').insert({
            usuario_id: id, 
            postagem_id: postagem.id,
            texto
        })

        if(!comentar){
            return res.status(400).json('Não foi possivel comentar essa postagem');
        }

        return res.status(200).json('Postagem comentada com sucesso.');
    } catch (error) {
        return res.status(400).json(error.menssage);
    }
}

const feed = async (req, res) => {
    const {id} = req.usuario;
    const {offset} = req.query;

    const o = offset ? offset : 0
    try{
       const postagens = await knex('postagens')
       .where('usuario_id', '!=', id)
       .limit(10)
       .offset(o);
       
       if(postagens.length === 0){
            return res.status(200).json(postagens);
       }
        

       for (const postagem of postagens) {
            // usuario
            const usuario = await knex('usuarios')
            .where({id: postagem.usuario_id})
            .select('imagem', 'username', 'verificado')
            .first()
            postagem.usuario = usuario

            // fotos
            const fotos = await knex('postagens_fotos')
            .where({postagem_id: postagem.id})
            .select('imagem');
            postagem.foto = fotos

            //curtidas
            const curtidas = await knex('postagens_curtidas')
            .where({postagem_id: postagem.id})
            .select('usuario_id');
            postagem.curtidas = curtidas.length;

            //curtio por mim 
            postagem.curtidoPorMim = curtidas.find(curtida => curtida.usuario_id === id) ? true : false;

            //comentarios
            const comentarios = await knex('postagens_comentarios')
            .leftJoin('usuarios', 'usuarios.id', 'postagens_comentarios.usuario_id')
            .where({postagem_id: postagem.id})
            .select('usuarios.username', 'postagens_comentarios.texto');
            postagem.comentarios = comentarios
       }

       return res.status(200).json(postagens);
    } catch (error) {
        console.log(error)
        return res.status(400).json(error);
    }
}

module.exports = {
    novaPostagem,
    curtir,
    comentar,
    feed
}
