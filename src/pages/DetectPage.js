import axios from 'axios';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-easy-toast';
import { Camera } from 'expo-camera';

export default function DetectPage() {
  const [hasPermission, setHasPermission] = useState(null);
  const cameraRef= useRef(null);
  const toastRef = useRef(); // toast ref 생성
  const windowHeight = Dimensions.get("window").height;

  // Toast 메세지 출력
  const showCopyToast = useCallback(() => {
    console.log("press detected");
    toastRef.current.show('press detected');
  }, []);

  const takePhoto = async () => {
    if(cameraRef){
      const data= await cameraRef.current.takePictureAsync({
        quality:1,
        exif:true
      });
      console.log('data: ', data.uri);
      const image = {
        name: "image",
        type: "image/jpg",
        uri: data.uri,
      }
      const formData = new FormData();
      formData.append('name', image);
      console.log("formData: ", formData);
      const headers = {
        "Content-Type": "multipart/form-data",
      };
      const apiUrl = "http://172.10.5.99:80";
      console.log("uploading...");
      const response = await axios.post(`${apiUrl}/test/imgUpload`, formData, {
        headers: headers,
        transformRequest: formData => formData,
      });
      console.log("upload response: ", console.log(response));
    }
  }

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
