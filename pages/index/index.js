// index.js
// 获取应用实例
require('./wasm_exec.js'); // 胶水代码
const app = getApp()
// const wasm_url = '/pages/index/sample.wasm.br'
const wasm_url = '/pages/index/iamgeCompress.wasm.br'
Page({
  data: {
    fileSrc:'',
    test_result1:'0'
  },
	async onReady() {
		global.console = console
		await this.initGo()
  },
  async initGo() {
		var _that = this;
    const go = new global.Go();
		try {
      const result = await WXWebAssembly.instantiate(wasm_url,go.importObject)
      console.log(result)
			console.log('initGo', result)
			// 运行go程序的main()方法
			await go.run(result.instance);
			// 注意：在go程序的main()方法退出之前，小程序不会运行到这个位置。
			console.log('initGo', '运行完成')
		} catch (err) {
			console.error('initGo', err)
		}
  },
  btnRun1(imageArray) {
      console.log('before compress size is',imageArray.length)
      // 第一个参数是数据，第二个是图片格式，如果是jpg的话不需要传递，但是如果是png的话是需要传递的
      var compressSize=global.imageCompress(imageArray,'png')
      console.log('after compress size is',compressSize)
      var compressResult=global.getCompressResult(new Uint8Array(compressSize))
      console.log(compressResult)
      this.saveImg(new Uint8Array(compressResult).buffer)
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
        console.log(tempFilePath)
        // this.compressImage(tempFilePath.tempFilePath,10)
        // 读取文件返回ArrayBuffer 
        wx.getFileSystemManager().readFile({
          filePath:tempFilePath.tempFilePath,
          success:(res)=>{
            console.log('文件读取成功',res.data.byteLength)
              this.btnRun1(new Uint8Array(res.data))
            // 保存文件 入参是ArrayBuffer 
            // this.saveImg(res.data)
          },
          fail:(error)=>{
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
  }
})
