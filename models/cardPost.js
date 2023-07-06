const Sequelize = require('sequelize');

module.exports = class CardPost extends Sequelize.Model{
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
            tagF: { //1
                type: Sequelize.STRING(25),
                allowNull: true,
            },
            tagS: { //2
                type: Sequelize.STRING(25),
                allowNull: true,
            },
            tagT: { //3
                type: Sequelize.STRING(25),
                allowNull: true,
            },
            category: {
                type: Sequelize.STRING(50),
                allowNull: false,
            },
            file: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },


        },{
            sequelize,
            timestamps: true, //시간
            modelName: 'CardPost',
            tableName: 'cardPosts',
            paranoid: true, //사용자가 삭제를 하면 소프트 삭제를 해줌, deleteAt에 timestamps값을 넣어주며 findAll사용시 검색에서 누락된다.
            charset: 'utf8',
            collate: 'utf8_general_ci',
        });
    }
    static associate(db) {
        db.CardPost.hasMany(db.CardPostComment);
        db.CardPost.belongsTo(db.User);
    }
}