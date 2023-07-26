// HomeScreen.js
import axios from 'axios';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Audio } from 'expo-av';
import { Camera } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImageManipulator from 'expo-image-manipulator';
import { Buffer } from 'buffer';

const apiUrl = "http://noongil.social";

const HomePage = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [recording, setRecording] = useState();
  const cameraRef= useRef(null);
  const windowHeight = Dimensions.get("window").height;

  const speakTextWithBackendTTS = async (text) => {
    try {
      const response = await axios.post(`${apiUrl}/tts`, { text }, { responseType: 'arraybuffer' });
      console.log("성공!");
    
      // Create a new Sound object and load the audio data
      const soundObject = new Audio.Sound();
      await soundObject.loadAsync({ uri: 'data:audio/mpeg;base64,' + Buffer.from(response.data).toString('base64') });
      await soundObject.playAsync();
    } catch (error) {
      console.log("실패!");
      console.log('Error while using Backend TTS API:', error);
    }
  };

  const takeVoice = async () => {
    // 햅틱으로 녹음 시작 알림
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      console.log('Starting recording..');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      // 4초간 녹음 진행
      await setTimeout(async () => {
        // 녹음 종료를 알리는 햅틱
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        console.log('Stopping recording..');
        setRecording(undefined);
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        console.log('Recording stopped and stored at', uri);

        // 녹음 음성 테스트를 위해 재생
        // console.log('Loading Sound');
        // const sound = new Audio.Sound();
        // await sound.loadAsync({ uri: uri });
        // await sound.replayAsync();
        // 테스트 종료

        // POST 설정 구성
        const formData = new FormData();
        formData.append('name', {
          name: "sound",
          type: "audio/m4a",
          uri: uri,
        });
        const headers = { "Content-Type": "multipart/form-data" };
        console.log("uploading...");

        // API 호출
        speakTextWithBackendTTS('요청을 처리 중이에요. 잠시만 기다려 주세요');
        await new Promise(resolve => setTimeout(resolve, 1000));

        const response = await axios.post(`${apiUrl}/stt/selection`, formData, {
          headers: headers,
          transformRequest: formData => formData,
        });
        console.log("upload result: ", response.data.content);

        // 결과 음성으로 출력. 분기해서 기능 수행하기
        // speakTextWithBackendTTS(response.data.content);
        if(response.data.content === "object-detection") {
          objectDetection();
        } else if(response.data.content === "tts") {
          OCR();
        } else {
          throw error("fail to catch voice");
        }
      }, 4000);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  const objectDetection = async () => {
    // 사진 촬영을 오디오 및 햅틱으로 알리기
    await speakTextWithBackendTTS("장면 인식을 위해 사진을 촬영할게요.");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // 사진 촬영하기
    if(cameraRef){
      const data= await cameraRef.current.takePictureAsync({
        quality:1,
        exif:true
      });
      const manipResult = await ImageManipulator.manipulateAsync(
        data.uri,
        [{ rotate: 90 }, { flip: ImageManipulator.FlipType.Vertical }, { flip: ImageManipulator.FlipType.Horizontal }],
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
      );
      console.log('data: ', data.uri);

      // 사진 제출폼 설정
      const image = {
        name: "image",
        type: "image/jpg",
        uri: manipResult.uri,
      }
      const formData = new FormData();
      formData.append('name', image);
      const headers = {
        "Content-Type": "multipart/form-data",
      };
      

      // 폼 제출 및 대기
      console.log("uploading...");
      const response = await axios.post(`${apiUrl}/object-detection`, formData, {
        headers: headers,
        transformRequest: formData => formData,
      });
      // 인식 결과를 음성으로 리턴
      console.log("upload result: ", response.data.content);
      speakTextWithBackendTTS(response.data.content);
    }
  }

  const OCR = async () => {
    // 사진 촬영을 오디오 및 햅틱으로 알리기
    await speakTextWithBackendTTS("글자 인식을 위해 사진을 촬영할게요.");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (cameraRef) {
      try {
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
        speakTextWithBackendTTS(text);
      } catch (error) {
        console.log(error);
      }
    }
  };

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      await Audio.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
    speakTextWithBackendTTS('안녕하세요, 눈길 입니다. 화면을 탭하고 필요한 기능을 말씀해 주세요');
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
          takeVoice();
        }} style={styles.cameraContiner}>
        </TouchableOpacity>
      </Camera>
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

export default HomePage;
