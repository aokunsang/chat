var redis = require("redis");
var config = require('./config')();
module.exports = function(){
	return	redis.createClient(config.redisPort, config.redisHost, {return_buffers:true});
};