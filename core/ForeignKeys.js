/**   
 * Foreign Keys for Sequelize
 */

QW.Models.Rights.belongsToMany(QW.Models.Users, { through: 'RightsOfUsers', as: 'users' });
QW.Models.Users.belongsToMany(QW.Models.Rights, { through: 'RightsOfUsers', as: 'rights' });