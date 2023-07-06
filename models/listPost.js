const Sequelize = require('sequelize');

module.exports = class ListPost extends Sequelize.Model{
    static init(sequelize){
        return super.init({
            title:{
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            content: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            category: {
                type: Sequelize.STRING(50),
                allowNull: false,
            },
            topic: {
                type: Sequelize.STRING(50),
                allowNull: false,
            },
            file: {
                type: Sequelize.STRING(1000),
                allowNull: true,
            },


        },{
            sequelize,
            timestamps: true,
            modelName: 'ListPost',
            tableName: 'listPosts',
            paranoid: true,
            charset: 'utf8',
            collate: 'utf8_general_ci',
        });
    }
    static associate(db) {
        db.ListPost.belongsTo(db.User);
        db.ListPost.hasMany(db.ListPostComment);

    }
}