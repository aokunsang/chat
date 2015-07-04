(function(){
    var d = document, w = window, msgSound = null, systemSound = null;
    w.chat = {
        msgObj : d.getElementById("message"),
		onlineCountObj : d.getElementById("onlineCount"),
		onlineUsersObj : d.getElementById("onlineusers"),
        user : {},
        socket : null,
        scrollToBottom:function(){
           w.scrollTo(0, this.msgObj.clientHeight);
        },
        genuid : function(){
            return new Date().getTime();
        },
        //提交用户名初始化
        usernameSubmit:function(){
            var username = d.getElementById("showusername").innerText;
            if(username != ""){
                this.loginit(username);
            }
            return false;
        },
		//替换表情
		replace_em : function(str){
			str = str.replace(/\</g,'&lt;');
			str = str.replace(/\>/g,'&gt;');
			str = str.replace(/\n/g,'<br/>');
			str = str.replace(/\[em_([0-9]*)\]/g,'<img src="/face/$1.gif" border="0" />');
			return str;
		},
        //提交聊天消息内容
        submitMsg:function(){
            var content = d.getElementById("content").value;
            if(content != ""){
                var obj = {
                    userid : this.user.userid,
                    username : this.user.username,
                    content : content
                };
                //向服务器发送消息
                this.socket.emit('message', obj);
                d.getElementById("content").value = "";
            }else{
                alert("发送内容不能为空");
            }
            return false;
        },
        //更新系统消息
        updateSysMsg:function(onlineUsers, username, action){
			var htmlUsers = "",sep = "",index = 0;
			for(m in onlineUsers){
				htmlUsers += sep + onlineUsers[m];
				sep = "|";
				index ++;
			}
			this.onlineUsersObj.innerText = "在线成员:"+htmlUsers;
            this.onlineCountObj.innerText = index;
            var htmlContent = '<div class="msg-system">' + username;
            htmlContent += (action == 'login') ? '加入聊天室' : '退出聊天室';
            htmlContent += '</div>';
            var section = d.createElement('section');
            section.className = "system J-mjrlinkWrap J-cutMsg";
            section.innerHTML = htmlContent;
            this.msgObj.appendChild(section);
			if(username != this.user.username){
				systemSound.play();
			}
            chat.scrollToBottom();
        },
		appendHistoryMsg:function(obj){
			var isme = obj.userid == chat.user.userid ? true : false;
			var contentDiv = '<div>' + this.replace_em(obj.content) + '</div>';
			var usernameSpan = '<span>' + obj.username + '</span>';
			var timeSection = '<section style="font-size:10px;color:#999">' + obj.time + '</section>';
			var section = d.createElement('section');
			if(isme){
				section.className = "user";
				section.innerHTML = timeSection + contentDiv + usernameSpan;
			}else{
				section.className = "service";
				section.innerHTML =  usernameSpan + contentDiv + timeSection;
			}
			this.msgObj.appendChild(section);
			this.scrollToBottom();
		},
        //用户退出聊天系统
        logout:function(){
			location.href = "/";
            this.socket.disconnect();
        },
        //用户登录初始化
        loginit:function(username){
            this.user.userid = this.genuid();
            this.user.username = username;
            this.scrollToBottom();
            //连接后端服务器
            this.socket = io();
            //通知服务器有用户登录
            this.socket.emit('open', this.user);
            //监听新用户登录以及历史消息推送
            this.socket.on('loginout', function(obj){
				chat.updateSysMsg(obj.onlineUsers, obj.username, obj.action);
            });
			//监听上线发送历史聊天内容
			this.socket.on('private chat',function(historyContents){
				if('undefined' != typeof historyContents && historyContents.length > 0){
					historyContents.forEach(function(item){
						console.log(item.toString());
						var obj = JSON.parse(item.toString());
						chat.appendHistoryMsg(obj);
					});
					var sectionLine = d.createElement('section');
					sectionLine.innerHTML = "================以上为历史聊天记录===================";
					sectionLine.style.textAlign="center";
					chat.msgObj.appendChild(sectionLine);
				}
			});
            //监听消息发送
            this.socket.on('chat message',function(obj){
                chat.appendHistoryMsg(obj);
				if(obj.username != chat.user.username){
					msgSound.play();
				}
            });
        }
    };
	d.getElementById("content").onkeydown = function(e){
		if(!e) e = window.event;//火狐中是 window.event
        if((e.keyCode || e.which) == 13){
            chat.submitMsg();
        }
	};
	soundManager.setup({
	  preferFlash: false,
	  flashVersion: 9,
	  url: '../music/',
	  useHighPerformance: true,
	  debugMode: false, // disable debug mode
	  onready: function() {
		msgSound = soundManager.createSound({
		   id: 'msgSound',
		   url: 'classic/crash.mp3',
		   volume: 50,
		   multiShot: true,
		   autoLoad: true,
		   autoPlay: false
		});
	   systemSound = soundManager.createSound({
		   id: 'systemSound',
		   url: 'classic/system.wav',
		   volume: 100,
		   multiShot: true,
		   autoLoad: true,
		   autoPlay: false
	   });
	   chat.usernameSubmit();
	  }
	});
    
})();