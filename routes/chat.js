var moment = require('moment');
var config = require('./config')();
var redis = require("./redis")();

var namespace = "default";

module.exports.web=function(app){
  app.get('/', function(req, res, next) {
	var errorStr = req.session.error;
	delete req.session.error;
    res.render('index', { title: config.chatTitle, error : errorStr});
  });
  app.post('/onchat', function(req,res,next){
	var username = req.body.username;
	if(username){
		//获取在线列表
		redis.hget(namespace,"onlineUsers",function(err,result){
			var isTrue = true;
			var resultData = result ? JSON.parse(result.toString()) : {};
			for(value in resultData){
				if(resultData.hasOwnProperty(value) && resultData[value] == username){
					isTrue = false; break;
				}
			}
			if(!isTrue){
				req.session.error = "昵称已存在；若刷新了页面，请重新填写昵称(可与之前相同)";
				res.redirect('/');
			}else{
				next();
			}
		});
	}else{
		req.session.error = "昵称不能为空";
		//req.flash('error',"昵称不能为空");
		res.redirect('/');
	}
  }, function(req, res) {
	res.render('chat', {title: config.chatTitle, username: req.body.username });
  });
};

module.exports.connect = function(io){
	
	io.on('connection',function(socket){
		socket.on('disconnect',function(){
			//获取在线列表
			redis.hget(namespace,"onlineUsers",function(err,result){
				var resultData = result ? JSON.parse(result.toString()) : {};
				if(resultData.hasOwnProperty(socket.id)){
					var username = resultData[socket.id];
					//删除退出用户
					delete resultData[socket.id];
					//重新设置在线用户列表
					redis.hset(namespace,"onlineUsers",JSON.stringify(resultData),redis.print);
					//设置在线人数-1
					//redis.hincrby(namespace,"onlineCount",-1,function(err,count){
						io.emit('loginout', {onlineUsers : resultData, username : username, action : 'logout'}, null);
					//});
				}
			});
		});

		socket.on('message',function(user){
			var timeStr = moment().format('YYYY-MM-DD HH:mm:ss');
			user.time = timeStr;
			//查询聊天记录
			redis.zadd("onlineContent",new Date().getTime(),JSON.stringify(user));
			io.emit('chat message',user);
		});

		socket.on("open",function(user){
			//socket.name = user.userid;
			 //设置在线人数列表
			redis.hget(namespace,"onlineUsers",function(err,result){
				var resultUsers = result ? JSON.parse(result.toString()) : {};
				resultUsers[socket.id] = user.username;
				//重新设置在线人数列表
				redis.hset(namespace,"onlineUsers",JSON.stringify(resultUsers),redis.print);
				//设置在线人数+1
				//redis.hincrby(namespace,"onlineCount",1,function(err,count){
					/*推送历史聊天记录*/
					redis.zrevrange(["onlineContent",0,5],function(err,resultData){
						var historyContents = [];
						resultData.reverse().forEach(function(data){
							historyContents.push(data.toString());
						});
						//向登录用户推送聊天记录
						io.to(socket.id).emit('private chat', historyContents);
						io.emit('loginout', {onlineUsers : resultUsers, username : user.username, action : 'login'});
					});
					//io.emit('loginout', {onlineUsers : onlineUsers, username : user.username, onlineCount : count.toString(), action : 'login'}, historyContents);
				});
			//});
		});
	});
}