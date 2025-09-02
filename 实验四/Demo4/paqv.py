from bs4 import BeautifulSoup
import re
import urllib.request
import json
import urllib.parse
import time


findlink = re.compile(r'<a.*?href="(.*?)".*?>(.*?)</a>')
findvideo = re.compile(r'vurl="([^"]*)"')
findtitle = re.compile(r'<title>(.*?)</title>')

def main():
    baseurl = "https://arch.ahnu.edu.cn/ksxs/ksxsdyq.htm"
    datalist = getdata(baseurl)
    savepath = "video.json"
    saveData(datalist,savepath)


def getdata(baseurl):
    datalist = []
    head = {}
    head['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    
    # 首先获取主页面
    request = urllib.request.Request(baseurl,headers=head)
    response = urllib.request.urlopen(request)
    html = response.read().decode('utf-8')
    soup = BeautifulSoup(html,'html.parser')

    for link in soup.find_all('div', class_='text'):
        item = re.findall(findlink,str(link))[0]
        url = item[0]
        title = re.findall('span class="">(.*?)</span>',str(item))[0]
        
        #对url进行处理
        if url.startswith('../'):
            url = urllib.parse.urljoin(baseurl, url)
        else:
            url = baseurl + url
        print(f"正在爬取: {title} - {url}")

        detail_data = get_detail_data(url, head)
        if detail_data:
            detail_data['id'] = len(datalist) + 1  
            detail_data['title'] = title
            datalist.append(detail_data)
        time.sleep(1)
    return datalist


def get_detail_data(url, headers):
    try:
        request = urllib.request.Request(url, headers=headers)
        response = urllib.request.urlopen(request)
        html = response.read().decode('utf-8')
        soup = BeautifulSoup(html, 'html.parser')
        
        video_links = []
        
        #<script name="_videourl" vurl="..."></script>
        for script in soup.find_all('script'):
            script_text = str(script)
            # 查找vurl="..."格式
            video_matches = findvideo.findall(script_text)
            for video_url in video_matches:
                if video_url.startswith('/'):
                    full_video_url = urllib.parse.urljoin(url, video_url)
                else:
                    full_video_url = video_url
                video_links.append(full_video_url)
                print(f"找到视频链接(vurl): {full_video_url}")
        
        
        # 去重
        video_links = list(set(video_links))
        
        print(f"页面 {url} 共找到 {len(video_links)} 个视频链接")
        
        return {
            'url': url,
            'video_links': video_links,
        }
        
    except Exception as e:
        print(f"爬取链接 {url} 时出错: {e}")
        return None


def saveData(datalist, savepath):
    json_data = []
    for data in datalist:
        json_item = {
            'id': data['id'],
            'title': data['title'],
            'videourl': data['video_links']  # 将video_links重命名为video_urls
        }
        json_data.append(json_item)
    
    # 写入JSON文件
    with open(savepath, 'w', encoding='utf-8') as f:
        json.dump(json_data, f, ensure_ascii=False, indent=2)
    
    print(f"数据已保存到 {savepath}")
    print(f"共保存了 {len(json_data)} 条记录")


if __name__ == "__main__":
    main()
