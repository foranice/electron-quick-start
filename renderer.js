// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const Vue=require('vue/dist/vue.common')
const VueCropper=require('vue-cropper')
const ElementUI=require('element-ui')
const {dialog} = require('electron').remote
const fs=require('fs')
const path=require('path')
const  BScroll=require('better-scroll')
Vue.use(ElementUI)
const vm=new Vue({
    el:'#app',
    data: {
        img:null,
        cropperimg:null,
        formLabelAlign: {
            inputdir: '',
            outputdir: path.resolve('./output'),
        },
        fixedW:1,
        fixedH:2,
        enablecrop:false,
        info: true,
        size: 1,
        outputType: 'jpeg',
        canScale: false,
        autoCrop: false,
        // 只有自动截图开启 宽度高度才生效
        autoCropWidth: 100,
        autoCropHeight: 75,
        // 开启宽度和高度比例
        fixed: true,
        msg:'asd',
        scroll:null,
        selectIndex:0,
        fileListInfo:{},
        status:0,
        cropWidth:0,
        cropHeight:0,
        currentPage:1,
        filePage:[],
    },
    components: {
        // <my-component> 将只在父组件模板中可用
        'cropper': VueCropper
    },
    methods:{
        startCrop () {
            // start
            //this.crap = true
            this.status=1;
           // this.$refs.cropper.startCrop()
        },
        stopCrop () {
            //  stop
            //this.crap = false
            //this.$refs.cropper.stopCrop()
        },
        clearCrop () {
            // clear
            this.$refs.cropper.clearCrop()
        },
        openInputDialog(){
            dialog.showOpenDialog(require('electron').remote.getCurrentWindow(),{
                properties  :["openDirectory"]
            },(res)=>{
                this.formLabelAlign.inputdir=res?res[0]:[]
                this.handleCurrentChange(1)
            })
        },
        openOutputDialog(){
            dialog.showOpenDialog(require('electron').remote.getCurrentWindow(),{
                properties  :["openDirectory"]
            },(res)=>{
                this.formLabelAlign.outputdir=res?res[0]:[]
            })
        },
        saveImg(){
            this.status=2;
            this.cropWidth=Math.round(this.$refs.cropper.cropW)
            this.cropHeight=Math.round(this.$refs.cropper.cropH)
            console.log(this.screenROI())
            console.log(this.trueROI())
            this.$refs.cropper.getCropBlob((data) => {
                var reader = new FileReader();
                reader.addEventListener("loadend", function() {
                    let buffer=Buffer.from(reader.result)
                    let srcpath=path.parse(vm.fileListInfo[vm.selectIndex].src)
                    let distpath=path.resolve(vm.formLabelAlign.outputdir,`${srcpath.name}-${Math.round(vm.trueROI().startX)}-${Math.round(vm.trueROI().startY)}-${vm.trueROI().width}-${vm.trueROI().height}${srcpath.ext}`)
                    fs.writeFileSync(distpath,buffer)
                    fs.appendFileSync(path.resolve(vm.formLabelAlign.outputdir,'log.txt'), `${new Date().getTime()} ${srcpath.base} ${Math.round(vm.trueROI().startX)
                    } ${Math.round(vm.trueROI().startY)} ${vm.trueROI().width} ${vm.trueROI().height} ${path.parse(distpath).base}`)
                    vm.fileListInfo[vm.selectIndex].dist=distpath
                    vm.fileListInfo[vm.selectIndex].edited=true
                   vm.cropperimg=distpath
                    vm.clearCrop()

                });
                reader.readAsArrayBuffer(data);
            })
        },
        selectImg(path,index){
            this.status=0;
            this.img=path.src
            this.selectIndex=index
        },
        imgOffset:function () {
            let node =document.querySelector('.cropper-box-canvas')
            return {
                x:(640-node.clientWidth*this.$refs.cropper.scale)/2,
                y:(480-node.clientHeight*this.$refs.cropper.scale)/2
            }
        },
        handleCurrentChange:function (currentPage) {
            this.filePage=this.fileList.splice((currentPage-1)*10,10)
        },
        screenROI:function () {
            try{
                if(this.status==0){
                    return {
                        startX:0,
                        startY:0,
                        width:0,
                        height:0
                    }
                }
                if(this.status==2){
                    return {
                        startX:Math.round((this.$refs.cropper.cropOffsertX-this.imgOffset().x)*100)/100,
                        startY:Math.round((this.$refs.cropper.cropOffsertY-this.imgOffset().y)*100)/100,
                        width:this.cropWidth,
                        height:this.cropHeight
                    }
                }
                return {
                    startX:Math.round((this.$refs.cropper.cropOffsertX-this.imgOffset().x)*100)/100,
                    startY:Math.round((this.$refs.cropper.cropOffsertY-this.imgOffset().y)*100)/100,
                    width:Math.round(this.$refs.cropper.cropW*100)/100,
                    height:Math.round(this.$refs.cropper.cropH*100)/100
                }
            }
            catch(err){
                console.log(err)
                return {
                    startX:0,
                    startY:0,
                    width:0,
                    height:0
                }
            }
        },
        trueROI:function () {
            try{
                return {
                    startX:Math.round(this.screenROI().startX/this.$refs.cropper.scale*100)/100,
                    startY:Math.round(this.screenROI().startY/this.$refs.cropper.scale*100)/100,
                    width:Math.round(this.screenROI().width/this.$refs.cropper.scale*100)/100,
                    height:Math.round(this.screenROI().height/this.$refs.cropper.scale*100)/100,
                }

            }
            catch(err){
                return {
                    startX:0,
                    startY:0,
                    width:0,
                    height:0
                }
            }

        }
    },
    mounted:function () {
        this.$refs.cropper.move=false
        document.onkeydown = (e)=>{
            console.log(e.key)
           if(e.key=='Escape'){
               this.clearCrop()
               this.status=0;
           }
           else if(e.key=='ArrowRight'){
                if(vm.selectIndex!=vm.fileListInfo.length-1){
                        vm.selectIndex++
                        vm.img=vm.fileListInfo[vm.selectIndex]?vm.fileListInfo[vm.selectIndex].src:null
                        vm.cropperimg=null
                    }

           }
           else if(e.key=='ArrowLeft'){
               if(vm.selectIndex!=0){
                   vm.selectIndex--
                   vm.img=vm.fileListInfo[vm.selectIndex]?vm.fileListInfo[vm.selectIndex].src:null
                   vm.cropperimg=null
               }
           }
           else if(e.key=='PageUp'){
                if(this.currentPage>1) this.currentPage--
           }
           else if(e.key=='PageDown'){
                if(this.currentPage<this.maxPage) this.currentPage++
           }



        }

    },
    computed:{
        fileList:function () {
            let res
            try{
                res=fs.readdirSync(this.formLabelAlign.inputdir)
            }
            catch(err){
                return []
            }
          let filelist= res.filter((elem)=>{
                console.log(path.parse(elem).ext.toLowerCase())
                return ['.jpg','.png','.bmp'].includes(path.parse(elem).ext.toLowerCase())
          }).map(elem=>path.resolve(this.formLabelAlign.inputdir,elem))
            this.fileListInfo=filelist.map((elem)=>{
               return {
                   src:elem,
                   dist:null,
                   edited:false,
               }
            })
            if(!this.img&&filelist.length!=0){
                this.img=filelist[0]
            }
            return this.fileListInfo
        },
        fixedNumber:function () {
            return [this.fixedW,this.fixedH]
        },
        maxPage:function () {
            return Math.ceil(this.fileList.length/10)
        }

    }
})