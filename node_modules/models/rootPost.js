const Sequelize = require("sequelize");

module.exports = class RootPost extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        title: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        content: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        tagF: {
          //1
          type: Sequelize.STRING(25),
          allowNull: true,
        },
        tagS: {
          //2
          type: Sequelize.STRING(25),
          allowNull: true,
        },
        tagT: {
          //3
          type: Sequelize.STRING(25),
          allowNull: true,
        },
        category: {
          type: Sequelize.STRING(30),
          allowNull: false,
        },
        file: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        UserId: {
          type: Sequelize.INTEGER(30),
          allowNull: false,
        },
      },
      {
        sequelize,
        timestamps: true, //시간
        modelName: "RootPost",
        tableName: "rootPosts",
        paranoid: true, //사용자가 삭제를 하면 소프트 삭제를 해줌, deleteAt에 timestamps값을 넣어주며 findAll사용시 검색에서 누락된다.
        charset: "utf8",
        collate: "utf8_general_ci",
      }
    );
  }
  static associate(db) {
    db.RootPost.belongsTo(db.User);
    db.RootPost.hasMany(db.RootComment);
  }
};
