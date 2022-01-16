import cv2
import pytesseract
import numpy as np
import os

per = 25

roi = [[(410, 236), (768, 282), 'text', 'Số'],
       [(300, 302), (830, 344), 'text', 'Họ tên'],
       [(584, 352), (770, 388), 'text', 'Ngày sinh'],
       [(480, 380), (566, 420), 'text', 'Giới tính'],
       [(838, 384), (984, 422), 'text', 'Quốc tịch'],
       [(300, 458), (936, 494), 'text', 'Quê quán'],
       [(700, 496), (910, 534), 'text', 'Địa chỉ'],
       [(300, 526), (962, 562), 'text', '']]



pytesseract.pytesseract.tesseract_cmd = 'D:\\Tesseract-OCR\\tesseract.exe'

imgQ = cv2.imread('cc.jpg')

h,w,c = imgQ.shape

orb = cv2.ORB_create(5000)
kp1, des1 = orb.detectAndCompute(imgQ,None)


path =  'sample'
myPicList = os.listdir(path)
print(myPicList)
for j,y in enumerate(myPicList):
    img = cv2.imread(path + '/'+y)

    
    kp2, des2 = orb.detectAndCompute(img, None)
    bf = cv2.BFMatcher(cv2.NORM_HAMMING)
    matches = bf.match(des2,des1)
    sorted(matches,key=lambda x:x.distance)
    good = matches[:int(len(matches)*(per/100))]
    imgMatch = cv2.drawMatches(img,kp2,imgQ,kp1,good[:50],None,flags=2)
    cv2.imshow('y1', imgMatch)


    srcPoints = np.float32([kp2[m.queryIdx].pt for m in good ]).reshape(-1,1,2)
    dstPoints = np.float32([kp1[m.trainIdx].pt for m in good]).reshape(-1, 1, 2)

    M, _ = cv2.findHomography(srcPoints,dstPoints,cv2.RANSAC,5.0)
    imgScan = cv2.warpPerspective(img,M,(w,h))
    cv2.imshow('y', imgScan)

    imgShow = imgScan.copy()
    imgMask = np.zeros_like(imgShow)

    myData = []

    for x,r in enumerate(roi):
        cv2.rectangle(imgMask,((r[0][0]),r[0][1]),((r[1][0]),r[1][1]),(0,255,00),cv2.FILLED)
        imgShow = cv2.addWeighted(imgShow,0.99,imgMask,0.1,0)

        imgCrop = imgScan[r[0][1]:r[1][1], r[0][0]:r[1][0]]

        

        if r[2] == 'text':
            txt = f'{r[3]} : {pytesseract.image_to_string(imgCrop,lang="vie")}'

            print(txt)
            myData.append(pytesseract.image_to_string(imgCrop,lang="vie"))
#             with open('dich.txt','a',encoding='utf-8') as f:
#                 f.writelines(txt)




        cv2.imshow('y', imgShow)







cv2.imshow('output',imgQ)
cv2.waitKey(0)
