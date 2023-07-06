const Sequelize = require('sequelize');

module.exports = class Project extends Sequelize.Model{
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
            category:{
                type: Sequelize.STRING(50),
                allowNull: false,

            }, //추가
            file: {
                type: Sequelize.STRING(1000),
                allowNull: true,
            },

            leader:{
                type: Sequelize.STRING(40),
                allowNull: false,
            },
            member:{
                type: Sequelize.STRING(255),
                allowNull:true,
            },

        },{
            sequelize,
            timestamps: true,
            modelName: 'Project',
            tableName: 'projects',
            paranoid: true,
            charset: 'utf8',
            collate: 'utf8_general_ci',
        });
    }
    static associate(db) {

        db.Project.hasMany(db.PatchNote);
        db.Project.belongsTo(db.User);
        db.Project.hasMany(db.ProjectComment);

    }
}