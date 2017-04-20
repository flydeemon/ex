// 裁剪插件
(function (){
	// 暴露接口
	window.Crop = Crop;

	function Crop(cfg) {
		var option = {
			input: cfg.input || null,
			title: cfg.title || '选择裁剪区域',
			windowWidth: cfg.windowWidth || 500,
			windowHeight: cfg.windowHeight || 350,
			boxWidth: cfg.boxWidth || 300,
			boxHeight: cfg.boxHeight || 200,
			cropMaxWidth: cfg.cropMaxWidth || 100,
			cropMaxHeight: cfg.cropMaxHeight || 100,
			showWidth: cfg.showWidth || 200,
			showHeight: cfg.showHeight || 200,
			handle: cfg.handle || function(url) {
				console.log('url:', url);
			}
		};
		this.init(option);
	}

	// 裁剪插件的原型
	Crop.prototype = {
		// 原型私有变量
		_$input: '', //上传文件按钮
		_$btnCrop: '', //裁剪按钮
		_$btnSave: '', //保存按钮
		_$btnClear: '', //取消按钮

		_$window: '', //裁剪窗口
		_window: {
			title: '',
			top: '',
			left: '',
			width: '',
			height: ''
		},
		_$img: '', //图片
		_imgShow: {
			souceX: 0,
			souceY: 0,
			width: '',
			height: '',
			scale: '' //图片的比例
		},
		_$box: '', //画板容器
		_$boxCanvas: '',
		_box: {
			top: 50,
			left: 50,
			width: '',
			height: '',
			scale: '' //盒子与原图的比例
		},
		_$cropBox: '', //裁剪框
		_$cropCanvas: '',
		_cropBox: {
			destX: 0,
			destY: 0,
			top: '',
			left: '',
			halfWidth: '',
			halfHeight: '',
			width: '',
			height: '',
			scale: ''
		},
		_$showBox: '', //展示画板
		_$showCanvas: '', 
		_showBox: {
			top: 50,
			left: 0,
			width: '',
			height: '',
			drawFlag: false
		},

		callback: '',

		//初始化
		init: function(cfg) {
			this._window.title = cfg.title;
			this._window.width = cfg.windowWidth;
			this._window.height = cfg.windowHeight;
			this._box.width = cfg.boxWidth;
			this._box.height = cfg.boxHeight;
			this._cropBox.top = this._box.top;
			this._cropBox.left = this._box.left;
			this._cropBox.halfWidth = cfg.cropMaxWidth / 2;
			this._cropBox.halfHeight = cfg.cropMaxHeight / 2;
			this._cropBox.width = cfg.cropMaxWidth;
			this._cropBox.height = cfg.cropMaxHeight;
			this._showBox.width = cfg.showWidth;
			this._showBox.height = cfg.showHeight;
			this.callback = cfg.handle;

			if (!cfg.input) {
				alert('必须传入一个上传按钮的ID!');
				return false;
			}

			this._$input = document.getElementById(cfg.input);
			this.readFile();
		},

		//加载文件
		readFile: function() {
			var self = this;
			if (typeof FileReader === 'undefined') {
				self._$input.setAttribute('disabled', 'disabled');
				alert("抱歉，你的浏览器不支持 FileReader");
				return false;
			} else {
				self._$input.addEventListener('change', function() {
					var file = this.files[0];
					if (!/image\/\w+/.test(file.type)) {
						alert("文件必须为图片！");
						return false;
					}
					var reader = new FileReader();
					reader.readAsDataURL(file);
					reader.onload = function(e) {
						self.drawWindow(this.result);
					};
				}, false);
			}
		},

		//渲染裁剪窗口
		drawWindow: function(src) {
			var self = this;

			if (self._$window) {
				self._$window.style.display = 'block';
			} else {
				var title = document.createElement('p');
				title.append(self._window.title);
				title.style.color = 'white';
				title.style.background = 'rgba(8,8,8,0.6)';
				title.style.margin = '0';
				title.style.paddingLeft = '20px';
				title.style.lineHeight = '30px';
				title.style.height = '30px';
				self._window.top = (window.innerHeight - self._window.height) / 2;
				self._window.left = (window.innerWidth - self._window.width) / 2;
				self._$window = document.createElement('div');
				self._$window.style.width = self._window.width + 'px';
				self._$window.style.height = self._window.height + 'px';
				self._$window.style.background = 'rgba(244,244,244,0.6)';
				self._$window.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.5)';
				self._$window.style.position = 'absolute';
				self._$window.style.top = self._window.top + 'px';
				self._$window.style.left = self._window.left + 'px';
				self._$window.append(title);
			}

			self.drawBtn();

			// 加载图片
			self._$img = new Image();
			self._$img.src = src;
			self._$img.onload = function() {
				self._imgShow.width = self._$img.width;
				self._imgShow.height = self._$img.height;
				self.drawCanvas();
			};

			var oCrop = document.getElementById('crop');
			oCrop.append(self._$window);
		},

		// 渲染按钮
		drawBtn: function(){
			var self = this;

			// 裁剪按钮
			if (!self._$btnCrop) {
				self._$btnCrop = document.createElement('button');
				self._$btnCrop.append('crop');
				self._$btnCrop.style.position = 'absolute';
				self._$btnCrop.style.bottom = '10px';
				self._$btnCrop.style.left = '50px';
				self._$window.append(self._$btnCrop);
				self._$btnCrop.addEventListener('click', crop, false);
			}
			
			// 保存按钮
			if (!self._$btnSave) {
				self._$btnSave = document.createElement('button');
				self._$btnSave.append('save');
				self._$btnSave.style.position = 'absolute';
				self._$btnSave.style.bottom = '10px';
				self._$btnSave.style.left = '110px';
				self._$window.append(self._$btnSave);
				self._$btnSave.addEventListener('click', save, false);
			}

			// 取消按钮
			if (!self._$btnClear) {
				self._$btnClear = document.createElement('button');
				self._$btnClear.append('clear');
				self._$btnClear.style.position = 'absolute';
				self._$btnClear.style.bottom = '10px';
				self._$btnClear.style.right = '10px';
				self._$window.append(self._$btnClear);
				self._$btnClear.addEventListener('click', clear, false);
			}

			//裁剪图片
			function crop(e) {
				e.stopPropagation(); 
				console.log('caij');
				var x = self._cropBox.destX * self._box.scale;
				var y = self._cropBox.destY * self._box.scale;
				var w = self._cropBox.width * self._box.scale;
				var h = self._cropBox.height * self._box.scale;
				self._$showBox.clearRect(0, 0, self._$showCanvas.width, self._$showCanvas.height);
				self._$showBox.drawImage(self._$img, x, y, w, h, 0, 0, self._showBox.width, self._showBox.height);
				self._showBox.drawFlag = true;
			}

			// 保存裁剪图片
			function save() {
				var base64Url = null;
				if (self._showBox.drawFlag) {
					base64Url = self._$showCanvas.toDataURL('image/jpeg');
					self.callback && self.callback(base64Url);
					clear();
				} else {
					alert('请先裁剪图片！');
				}
			}

			//清空画板
			function clear() {
				// 初始值
				self._cropBox.top = 50;
				self._cropBox.left = 50;
				self._$box.clearRect(0, 0, self._box.width, self._box.height);
				self._$cropBox.clearRect(0, 0, self._cropBox.width, self._cropBox.height);
				self._$showBox.clearRect(0, 0, self._showBox.width, self._showBox.height);
				self._showBox.drawFlag = false;
				self._$window.style.display = 'none';
				self._$input.value = null;
			}
		},

		//渲染画板
		drawCanvas: function() {
			var self = this;
			// 让其中一边铺满
			if (self._imgShow.width >= self._imgShow.height) {
				self._imgShow.scale = self._imgShow.width / self._imgShow.height;
				self._box.height = self._box.width / self._imgShow.scale;
				self._box.scale = self._imgShow.width / self._box.width;
			} else {
				self._imgShow.scale = self._imgShow.height / self._imgShow.width;
				self._box.width = self._box.height / self._imgShow.scale;
				self._box.scale = self._imgShow.width / self._box.height;
			}

			if (!self._$boxCanvas) {
				self._$boxCanvas = document.createElement('canvas');
				self._$window.append(self._$boxCanvas);
			}

			self._$boxCanvas.style.position = 'absolute';
			self._$boxCanvas.style.top = self._box.top + 'px';
			self._$boxCanvas.style.left = self._box.left + 'px';
			self._$boxCanvas.width = self._box.width;
			self._$boxCanvas.height = self._box.height;
			self._$boxCanvas.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.5)';
			self._$box = self._$boxCanvas.getContext('2d');
			self._$box.drawImage(self._$img, self._imgShow.souceX, self._imgShow.souceY, self._box.width, self._box.height);
			self._$box.fillStyle = 'rgba(0, 0, 0, 0.6)';
			self._$box.fillRect(self._imgShow.souceX, self._imgShow.souceY, self._box.width, self._box.height);

			self.drawCrop();
			self.drawShow();
		},

		//渲染裁剪框
		drawCrop: function() {
			var self = this;
			if (!self._$cropCanvas) {
				self._$cropCanvas = document.createElement('canvas');
				self._$window.append(self._$cropCanvas);
			}
			
			self._$cropCanvas.style.border = '1px dashed #2196F3';
			self._$cropCanvas.style.position = 'absolute';
			self._$cropCanvas.style.top = self._cropBox.top + 'px';
			self._$cropCanvas.style.left = self._cropBox.left + 'px';
			self._$cropCanvas.width = self._cropBox.width;
			self._$cropCanvas.height = self._cropBox.height;
			self._$cropCanvas.style.boxShadow = '0 0 10px rgba(0, 204, 204, 0.5)'; 
			self._$cropBox = self._$cropCanvas.getContext('2d');
			self._$cropBox.drawImage(self._$img, self._imgShow.souceX, self._imgShow.souceY, self._box.width, self._box.height);

			self.addCropMove();
		},

		//裁剪框移动事件
		addCropMove: function() {
			var self = this;
			var minX = self._window.left + self._box.left;
			var minY = self._window.top + self._box.top;
			var maxX = minX + self._box.width - self._cropBox.halfWidth;
			var maxY = minY + self._box.height - self._cropBox.halfHeight;

			// 移出所有绑定的事件
			self._$window.removeEventListener('mousedown', down, false);
			document.removeEventListener('mousemove', move, false);
			document.removeEventListener('mouseup', up, false);

			// 添加事件
			self._$window.addEventListener('mousedown', down, false);

			document.addEventListener('mouseup', up, false);

			function down(e){
				e.stopPropagation();
				console.log(e);
				document.addEventListener('mousemove', move, false);
			}

			function up(){
				document.removeEventListener('mousemove', move, false);
			}

			function move(e) {
				e.stopPropagation(); 
				var x = e.clientX;
				var y = e.clientY;

				// 定位裁剪框的 x 坐标
				if (x < minX ) {
					self._cropBox.left = self._box.left;
					self._$cropCanvas.style.left = self._cropBox.left + 'px';
				} else if (x > maxX) {
					self._cropBox.left = self._box.left + self._box.width - self._cropBox.width;
					self._$cropCanvas.style.left = self._cropBox.left + 'px';
				} else if (x >= minX + self._cropBox.halfWidth && x <= maxX) {
					self._cropBox.left = x - self._window.left - self._cropBox.halfWidth;
					self._$cropCanvas.style.left = self._cropBox.left + 'px';
				}

				// 定位裁剪框的 y 坐标
				if (y < minY) {
					self._cropBox.top = self._box.top;
					self._$cropCanvas.style.top = self._cropBox.top + 'px';
				} else if (y > maxY) {
					self._cropBox.top = self._box.top + self._box.height - self._cropBox.height;
					self._$cropCanvas.style.top = self._cropBox.top + 'px';
				} else if (y >= minY + self._cropBox.halfHeight && y <= maxY) {
					self._cropBox.top = y - self._window.top - self._cropBox.halfHeight;
					self._$cropCanvas.style.top = self._cropBox.top + 'px';
				}

				// 渲染裁剪框中的图片
				self.drawCropAlign(self._cropBox.left, self._cropBox.top);
			}
		},

		//再次渲染裁剪框
		drawCropAlign: function(cropX, cropY) {
			var self = this;
			// 负数是因为背景在移动
			self._cropBox.destX = cropX - self._box.left;
			self._cropBox.destY = cropY - self._box.top;
			self._$cropBox.clearRect(0, 0, self._cropBox.width, self._cropBox.height);
			self._$cropBox.drawImage(self._$img, -self._cropBox.destX, -self._cropBox.destY, self._box.width, self._box.height);
		},

		//渲染展示页
		drawShow: function() {
			var self = this;
			if (!self._$showCanvas) {
				self._$showCanvas = document.createElement('canvas');
				self._$window.append(self._$showCanvas);
			}

			self._$showCanvas.style.position = 'absolute';
			self._$showCanvas.style.top = '50px';
			self._$showCanvas.style.left = self._box.left + self._box.width + 10 + 'px';
			self._$showCanvas.width = self._showBox.width;
			self._$showCanvas.height = self._showBox.height;
			self._$showCanvas.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.5)';
			self._$showBox = self._$showCanvas.getContext('2d');
		}
	};
})();
