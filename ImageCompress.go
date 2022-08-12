package main

import (
	"bytes"
	"github.com/nfnt/resize"
	"image/jpeg"
	"strconv"
	"syscall/js"
)

var totalNum int = 0

// js调用Go。点击按钮一次，增加一次计数。
func addTotal(this js.Value, args []js.Value) interface{} {
	filePath := args[0].String()

	console := js.Global().Get("console")

	console.Call("log", "file path is "+filePath)

	totalNum = totalNum + 1
	return js.ValueOf(totalNum)
}

const LOG_PREFIX = "com.mydao.image.compress:"

func main() {
	// 创建通道
	channel := make(chan int)
	// 1.Go调用js的console.log()方法,在开发者工具的Consol面板中查看。
	console := js.Global().Get("console")

	console.Call("log", LOG_PREFIX+" image compress client start.....")

	js.Global().Set("addTotal", js.FuncOf(addTotal))
	console.Call("log", LOG_PREFIX+" register go function addTotal successfully,This method is only used for testing")

	js.Global().Set("test", js.FuncOf(test))
	console.Call("log", LOG_PREFIX+" register go function test successfully,This method is only used for testing")

	js.Global().Set("imageCompress", js.FuncOf(imageCompress))
	js.Global().Set("getCompressResult", js.FuncOf(getCompressResult))
	console.Call("log", LOG_PREFIX+" register go image compress function [imageCompress,getCompressResult] successfully..")

	js.Global().Set("noWechatImageCompress", js.FuncOf(noWeChatImageCompress))
	console.Call("log", LOG_PREFIX+" register go image compress function [noWechatImageCompress] successfully,weChat applet not available")

	// 通道阻塞了main()方法
	<-channel

	// main()方法在结束之前，不会运行到这个位置。
	console.Call("log", "exit")
}

var resultBytes []byte = nil

func imageCompress(this js.Value, args []js.Value) interface{} {
	//读取js发过来的array buffer
	array := args[0]

	inBuf := make([]uint8, array.Get("byteLength").Int())

	js.CopyBytesToGo(inBuf, array)

	reader := bytes.NewReader(inBuf)

	img, _ := jpeg.Decode(reader)

	compressByteBuffer := new(bytes.Buffer)

	imageCompress := resize.Resize(1000, 0, img, resize.NearestNeighbor)

	_ = jpeg.Encode(compressByteBuffer, imageCompress, nil)

	resultBytes = compressByteBuffer.Bytes()

	return js.ValueOf(len(resultBytes))
}

func getCompressResult(this js.Value, args []js.Value) interface{} {
	resultArray := args[0]
	_ = js.CopyBytesToJS(resultArray, resultBytes)
	return resultArray
}

func noWeChatImageCompress(this js.Value, args []js.Value) interface{} {
	//读取js发过来的array buffer
	array := args[0]

	inBuf := make([]uint8, array.Get("byteLength").Int())

	js.CopyBytesToGo(inBuf, array)

	reader := bytes.NewReader(inBuf)

	img, _ := jpeg.Decode(reader)

	compressByteBuffer := new(bytes.Buffer)

	imageCompress := resize.Resize(1000, 0, img, resize.NearestNeighbor)

	_ = jpeg.Encode(compressByteBuffer, imageCompress, nil)

	resultBytes = compressByteBuffer.Bytes()

	unit8Array := js.Global().Get("Uint8Array").New(len(resultBytes))

	_ = js.CopyBytesToJS(unit8Array, resultBytes)

	return unit8Array
}

func test(this js.Value, args []js.Value) interface{} {

	//读取js发过来的array buffer
	array := args[0]
	result := args[1]

	inBuf := make([]uint8, array.Get("byteLength").Int())

	js.CopyBytesToGo(inBuf, array)

	reader := bytes.NewReader(inBuf)

	img, _ := jpeg.Decode(reader)

	compressByteBuffer := new(bytes.Buffer)

	console := js.Global().Get("console")

	console.Call("log", js.ValueOf(len(inBuf)))

	console.Call("log", array)

	imageCompress := resize.Resize(1000, 0, img, resize.NearestNeighbor)

	_ = jpeg.Encode(compressByteBuffer, imageCompress, nil)

	resultBytes := compressByteBuffer.Bytes()

	n := js.CopyBytesToJS(result, resultBytes)

	console.Call("log", "bytes copied:", strconv.Itoa(n))

	return result
}
