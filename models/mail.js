/**
 *\brief mail module
 *\author jefftian
 *\date Wed Dec  1 15:04:05 CST 2015
 */
/***********************************************************************
 * 邮件附件发送注意事项：
 * 1、通过指定path的形式比直接使用content的形式占用内存少很多
 * 2、受限于各邮件服务商的附件限额大小，最大附件大小有限制(163邮箱为50M)
 * 3、受限于V8最大可用堆栈大小限制，尽量限制附件的大小
 * *********************************************************************/
var nodemailer = require('nodemailer');
var emailCfg = require('../settings').email;
var handler = module.exports;

var transporter = nodemailer.createTransport({
    service: emailCfg.service,
    post: emailCfg.port,
    auth: {
        user: emailCfg.user,
        pass: emailCfg.password
    }
});

handler.sendMail = function(option, callback) {
    option.from = emailCfg.user;
    transporter.sendMail(option, function(error, info){
        if(error) console.log('sendMail error:', error, option.to);
        else console.log('sendMail success: ', info.response, option.to);
        callback(error);
    });
};

