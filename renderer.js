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
        formLabelAlign: {
            inputdir: '',
            outputdir: path.resolve('./output'),
        },
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
        fixedNumber: [4, 3],
        msg:'asd',
        scroll:null,
        selectIndex:0,
        fileListInfo:{}
    },
    components: {
        // <my-component> 将只在父组件模板中可用
        'cropper': VueCropper
    },
    methods:{
        startCrop () {
            // start
            //this.crap = true

            this.$refs.cropper.startCrop()
        },
        stopCrop () {
            //  stop
            //this.crap = false
            this.$refs.cropper.stopCrop()
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
           // alert(111)
            this.$refs.cropper.getCropBlob((data) => {
                var reader = new FileReader();
                reader.addEventListener("loadend", function() {
                    let buffer=Buffer.from(reader.result)
                    let srcpath=path.parse(vm.fileListInfo[vm.selectIndex].src)
                    let distpath=path.resolve(vm.formLabelAlign.outputdir,(new Date().getTime()).toString()+srcpath.ext)
                    fs.writeFileSync(distpath,buffer)
                    vm.fileListInfo[vm.selectIndex].dist=distpath
                    vm.fileListInfo[vm.selectIndex].edited=true
                    if(vm.selectIndex!=vm.fileListInfo.length-1){
                        vm.selectIndex++
                        vm.img=vm.fileListInfo[vm.selectIndex].src
                    }
                    vm.clearCrop()

                });
                reader.readAsArrayBuffer(data);
            })
        },
        selectImg(path,index){
            this.img=path.src
            this.selectIndex=index
        }
    },
    mounted:function () {
        this.$refs.cropper.move=false
        this.scroll = new BScroll(this.$refs.scroll,{
            scrollY: false,
            scrollX:true,
            click: true
        })
        document.onkeydown = (e)=>{
           if(e.key=='Escape'){
               this.clearCrop()
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
        }
    }
})