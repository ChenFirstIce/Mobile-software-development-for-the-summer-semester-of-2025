// Index.ets
import {BusinessError} from '@kit.BasicServicesKit'

@Entry
@Component
struct Index {
  @State message: string = 'Hello World';

  build() {
    Row() {//设置row组件
      Column() {
        Text(this.message)
          .fontSize(50)
          .fontWeight(FontWeight.Bold)
        Button(){
          Text('Next')
            .fontSize(30)
            .fontWeight(FontWeight.Bold)
        }
        .type(ButtonType.Capsule)
        .margin({
          top: 20
        })
        .backgroundColor('#0D9FFB')
        .width('40%')
        .height('5%')
        //可以设置函数
        .onClick(() => {
          console.info(`Succeeded in clicking the 'Next' button.`)
          // 获取UIContext
          let uiContext: UIContext = this.getUIContext();
          let router = uiContext.getRouter();
          // 跳转到第二页
          router.pushUrl({ url: 'pages/Second' }).then(() => {
            console.info('Succeeded in jumping to the second page.')
          }).catch((err: BusinessError) => {
            console.error(`Failed to jump to the second page. Code is ${err.code},
            message is ${err.message}`)
          })
        })
      }
      .width('100%')
    }
    .height('100%')
  }
}