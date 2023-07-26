import axios from 'axios';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-easy-toast';
import { Camera } from 'expo-camera';
import * as Speech from 'expo-speech';


const OCRPage = () => {
    const [hasPermission, setHasPermission] = useState(null);
    const cameraRef= useRef(null);
    const toastRef = useRef(); // toast ref 생성
    const windowHeight = Dimensions.get("window").height;

    useEffect(() => {
        Speech.speak('안녕하세요, 눈길 OCR 입니다. 무엇을 도와드릴까요?');
    }, []);

    // Toast 메세지 출력
    const showCopyToast = useCallback(() => {
        console.log("press detected");
        toastRef.current.show('press detected');
    }, []);

    const takePhoto = async () => {
        if (cameraRef) {
          try {
            const apiUrl = 'http://172.10.5.132:80';
    
            const photo = await cameraRef.current.takePictureAsync({
              quality: 1,
              exif: true,
            });
            console.log('data: ', photo.uri);
            const image = {
              name: 'name',
              type: 'image/jpg',
              uri: photo.uri,
            };
    
            const formData = new FormData();
            formData.append('name', image);
    
            console.log('uploading...');
            const response = await axios.post(`${apiUrl}/ocr`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });
            const { text } = response.data;
            console.log('OCR result:', text);
    
            // 읽어주기
            Speech.speak(text);
          } catch (error) {
            console.log(error);
          }
        }
      };

    useEffect(() => {
        (async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
        })();
    }, []);

    if (hasPermission === null) {
        return <View />;
    }
    if (hasPermission === false) {
        return <Text>No access to camera</Text>;
    }
    return (
        <View style={{ flex: 1 }}>
        <Camera 
            style={{ flex: 1, overflow: 'hidden' }}
            ratio="16:9"
            type={Camera.Constants.Type.back}
            ref={cameraRef}>
            <TouchableOpacity onPress={() => {
            showCopyToast();
            takePhoto();
            }} style={styles.cameraContiner}>
            </TouchableOpacity>
        </Camera>
        <Toast ref={toastRef}
                positionValue={windowHeight * 0.55}
                fadeInDuration={200}
                fadeOutDuration={1000}
                style={{backgroundColor:'rgba(33, 87, 243, 0.5)'}}
        />
        </View>
    );
}

const styles = StyleSheet.create({
  cameraContiner: {
    height: Dimensions.get("window").height,
  },
  camera: {

  },
  snapAlertToast: {

  }
});


export default OCRPage;