const Sequelize = require('sequelize');

module.exports = class ListPostComment extends Sequelize.Model{
    static init(sequelize){
        return super.init({
            content: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            group:{ //=모 댓글번호
                type: Sequelize.INTEGER(30),
                allowNull: false,
            },
            sequence: {
                type: Sequelize.INTEGER(100),
                allowNull: false,
            },


        },{
            sequelize,
            timestamps: true,
            underscored: false,
            modelName: 'ListPostComment',
            tableName: 'listPostComments',
            paranoid: true,
            charset: 'utf8',
            collate: 'utf8_general_ci',
        });
    }
    static associate(db) {
        db.ListPostComment.belongsTo(db.User);
        db.ListPostComment.belongsTo(db.ListPost);
    }
}