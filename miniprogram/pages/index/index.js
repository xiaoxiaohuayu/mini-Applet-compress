// pages/index/index.js
// 获取应用实例
require('../utils/wasm_exec'); // 胶水代码
// const app = getApp()
const wasm_url = "/pages/utils/iamgeCompress2.wasm.br"
// const wasm_url = "/pages/utils/tmp.wasm"
Page({
  data: {
    fileSrc:'',
    test_result1:'0',
    upload_bg_url:'../../images/upload.png',
    loading_img:'',
    access_token:'',
    dialogvisible: false,
    inputs: [{
      text: '弹窗标题：',
      value: '稍等～正在努力💪压缩'
    }, {
      text: '弹窗宽度：',
      value: '85%'
    }],
    switchs: [{
      text: '开启动画',
      value: true
    }, {
      text: '是否可以点击modal关闭Dialog',
      value: false
    }, {
      text: '确认按钮是否带 loading 图标',
      value: false
    }, {
      text: '是否收集formId',
      value: false
    }],
    openTypes: ['', 'getUserInfo', 'contact', 'getPhoneNumber', 'openSetting', 'launchApp'],
    buttonConf: [{
      title: '确认按钮',
      text: '确认',
      show: true,
      color: '#333333',
      background: '#ffffff',
      openType: ''
    }, {
      title: '取消按钮',
      text: '取消',
      show: true,
      color: '#999999',
      background: '#ffffff',
      openType: ''
    }],
    colors: [],
    opacity: '0.4'



  },
	async onReady() {
		global.console = console
    await this.initGo()
    
  },
  onLoad:function(){
    this.getAccessTokenFun()
  },
  async initGo() {
    const go = new global.Go();
		try {
      const result = await WXWebAssembly.instantiate(wasm_url,go.importObject)
			console.log('initGo', result)
			// 运行go程序的main()方法
			await go.run(result.instance);
			// 注意：在go程序的main()方法退出之前，小程序不会运行到这个位置。
			console.log('initGo', '运行完成')
		} catch (err) {
			console.error('initGo', err)
		}
  },
  execution(imageArray,suffix) {
    return new Promise((resolve,reject)=>{
      console.log('ya')
      console.log('before compress size is',imageArray.length)
      // 第一个参数是数据，第二个是图片格式，如果是jpg的话不需要传递，但是如果是png的话是需要传递的
      if(suffix==='png'){
        var compressSize=global.imageCompress(imageArray,'png')
      }else{
        var compressSize=global.imageCompress(imageArray)
      }
      console.log('after compress size is',compressSize)
      wx.showToast({
        title: '正在压缩...',
        icon: 'loading',
      })
      try {
        var compressResult=global.getCompressResult(new Uint8Array(compressSize))
        console.log(compressResult)
        resolve(new Uint8Array(compressResult).buffer)
        // this.saveImg(new Uint8Array(compressResult).buffer)
      } catch (error) {
        reject(error)
      }
    })
  },
  // 读取文件 获取ArrayBuffer缓冲区数据
  uploadfile:function(){
    wx.chooseMedia({
      mediaType:['image'],
      sizeType:['compressed'],
      sourceType:['album'],
      count:1,
      success:(res)=> {
        console.log(res)
        const {tempFiles} = res || {};
        const [tempFilePath] = tempFiles
        const arryFex = tempFilePath.tempFilePath.split('.')
        const suffix = arryFex[1] || ''
        console.log(tempFilePath,arryFex,'====')
        this.media_check(tempFilePath.tempFilePath)
        this.setData({
          loading_img:tempFilePath.tempFilePath
        })
        // this.compressImage(tempFilePath.tempFilePath,10)
        // 读取文件返回ArrayBuffer 
        wx.getFileSystemManager().readFile({
          filePath:tempFilePath.tempFilePath,
          success:(res)=>{
            console.log('文件读取成功',res.data.byteLength)
            // wx.showToast({
            //   title: '正在压缩...',
            //   icon: 'loading',
            // })
            this.showDialog()
            this.execution(new Uint8Array(res.data),suffix).then(res=>{
              this.closeDialog()
              wx.showToast({
                title: '压缩成功！',  // 标题
                icon: 'success',   // 图标类型，默认success
                duration: 1500   // 提示窗停留时间，默认1500ms
              })
              this.saveImg(res)
            }).catch(res=>{
              this.closeDialog()
              wx.showToast({
                title: '压缩失败',  // 标题
                icon: 'error',   // 图标类型，默认success
                duration: 1500   // 提示窗停留时间，默认1500ms
              })
            })
            // 保存文件 入参是ArrayBuffer 
            // this.saveImg(res.data)
          },
          fail:(error)=>{
            wx.showToast({
              title: '文件读取失败',  // 标题
              icon: 'error',   // 图标类型，默认success
              duration: 1500   // 提示窗停留时间，默认1500ms
            })
            console.log('文件读取失败')
          }
        })
        this.setData({
          fileSrc:tempFilePath.tempFilePath
        })
      },
      fail:function(){}
    })
  },
  // 微信自带的图片压缩
  compressImage:function(src,quality){
    wx.compressImage({
      src,
      quality,
      success:(res)=>{
        console.log(res,'imgyasuo')
        wx.getFileSystemManager().readFile({
          filePath:res.tempFilePath,
          success:(res)=>{
            console.log(res,'saveImg')
            this.saveImg(res.data)
          }
        })
      }
    })
  },
  // 转base64
   arrayBufferToBase64:function(buffer) {
    var binary = '';
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
    }
      return "data:image/png;base64," + this.btoa(binary);
  },
   btoa:function(string) {
    var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
      string = String(string);
      var bitmap, a, b, c,
          result = "", i = 0,
          rest = string.length % 3; // To determine the final padding
      for (; i < string.length;) {
          if ((a = string.charCodeAt(i++)) > 255
                  || (b = string.charCodeAt(i++)) > 255
                  || (c = string.charCodeAt(i++)) > 255)
              throw new TypeError("Failed to execute 'btoa' on 'Window': The string to be encoded contains characters outside of the Latin1 range.");
          bitmap = (a << 16) | (b << 8) | c;
          result += b64.charAt(bitmap >> 18 & 63) + b64.charAt(bitmap >> 12 & 63)
                  + b64.charAt(bitmap >> 6 & 63) + b64.charAt(bitmap & 63);
      }
      // If there's need of padding, replace the last 'A's with equal signs
      return rest ? result.slice(0, rest - 3) + "===".substring(rest) : result;
  },
  // 图片保存到相册
  saveImg:function(buffer){
    const fs = wx.getFileSystemManager();
    fs.writeFile({
      filePath: wx.env.USER_DATA_PATH + '/qucode.png',
      data: buffer,
      success: res => {
        wx.saveImageToPhotosAlbum({
          filePath: wx.env.USER_DATA_PATH + '/qucode.png',
          success: function () {
            wx.showToast({
              title: '保存成功',
            })
          },
          fail: function (err) {
            console.log(err)
          }
        })
      }, fail: err => {
        console.log(err)
      }
    })
  },
  // 获取getAccessToken c9c9187d9de8c2c4b23ed3af41d867cf
  getAccessTokenFun: function(){
    wx.request({
      url: 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wxae809fd9b0d76ad5&secret=c9c9187d9de8c2c4b23ed3af41d867cf', 
      method: 'get', 
      success: (res)=>{ 
        const {access_token} = res.data || {}
        this.data.access_token = access_token
        console.log('success',res)
      }, 
      fail: (res)=>{ 
        console.log('fail',res)
      }, 
    })
  },
  // 检测
  media_check:function(img_url){
    console.log(this.data.access_token)
    return new Promise((resolve, reject)=>{
      wx.request({
        url: 'https://api.weixin.qq.com/wxa/media_check_async?access_token='+this.data.access_token, 
        method: 'post', 
        data:{
          media_type:2,//1:音频;2:图片
          media_url:img_url,
          version:2,
          scene:'1',
          openid:'wxae809fd9b0d76ad5'
        },
        success: (res)=>{ 
          const {access_token} = res.data || {}
          this.data.access_token = access_token
          resolve(res)
          console.log('success',res)
        }, 
        fail: (res)=>{ 
          reject(res)
          console.log('fail',res)
        }, 
      })
    })

  },
  showDialog: function() {
    this.setData({
      dialogvisible: true
    })
  },
  closeDialog: function() {
    this.setData({
      dialogvisible: false
    })
  },
})
