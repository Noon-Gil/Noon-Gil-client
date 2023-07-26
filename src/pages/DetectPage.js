import axios from 'axios';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-easy-toast';
import { Audio } from 'expo-av';
import { Camera } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Speech from 'expo-speech';

const DetectPage = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [recording, setRecording] = useState();
  const cameraRef= useRef(null);
  const toastRef = useRef(); // toast ref 생성
  const windowHeight = Dimensions.get("window").height;

  useEffect(() => {
    Speech.speak('안녕하세요, 눈길 Object Detection 입니다. 무엇을 도와드릴까요?');
  }, []);

  // Toast 메세지 출력
  const showCopyToast = useCallback(() => {
    console.log("press detected");
    toastRef.current.show('press detected');
  }, []);

  const takeVoice = async () => {
    Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    );
    try {
      console.log('Starting recording..');
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      await setTimeout(async () => {
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
        console.log('Stopping recording..');
        setRecording(undefined);
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        console.log('Recording stopped and stored at', uri);
        console.log('Loading Sound');
        const sound = new Audio.Sound();
        await sound.loadAsync({ uri: uri });
        await sound.replayAsync();

        const formData = new FormData();
        formData.append('name', {
          name: "sound",
          type: "audio/m4a",
          uri: uri,
        });
        const headers = { "Content-Type": "multipart/form-data" };
        const apiUrl = "http://dht.social";
        console.log("uploading...");
        const response = await axios.post(`${apiUrl}/stt/selection`, formData, {
          headers: headers,
          transformRequest: formData => formData,
        });
        console.log("upload result: ", response.data.content);
        Speech.speak(response.data.content);
      }, 4000);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  const takePhoto = async () => {
    Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    );

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
      const apiUrl = "http://172.10.5.132:80";
      console.log("uploading...");
      const response = await axios.post(`${apiUrl}/object-detection`, formData, {
        headers: headers,
        transformRequest: formData => formData,
      });
      console.log("upload result: ", response.data.content);
      Speech.speak(response.data.content);
    }
  }

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      setHasPermission(status === 'granted');
    })();
    Speech.speak('안녕하세요, 눈길 물체인식 입니다. 화면을 탭하면 이미지를 묘사해 볼게요');
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
          takeVoice();
          // takePhoto();
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


export default DetectPage;