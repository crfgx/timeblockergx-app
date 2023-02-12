import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { useKeepAwake } from "expo-keep-awake";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Image,
} from "react-native";
import { useFonts } from "expo-font";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import BackgroundTimer from "react-native-background-timer";
import "expo-dev-client";
import * as AppleAuthentication from "expo-apple-authentication";

WebBrowser.maybeCompleteAuthSession();

export default function App() {
  const [accessToken, setAccessToken] = useState();
  console.log(accessToken ? "accessToken true" : "accessToken false");
  const [userInfo, setUserInfo] = useState();
  const [summary, setSummary] = useState();
  console.log(summary ? summary : "no summary setted");
  const [remainTime, setRemainTime] = useState();
  const [trigger, setTrigger] = useState();
  const [calendar, setCalendar] = useState();
  const [endHour, setEndHour] = useState();
  const [endMin, setEndMin] = useState();
  const [connected, setConnected] = useState();
  /*   console.log(userInfo ? "logged in" : "no login");
  console.log(remainTime ? remainTime : "remain time not setted");
  console.log("new hour:" + newHour);
  console.log("new min:" + newMin); */

  //accessToken i storage a yazsin
  //remaintime 0 olunca notifikasyon gondersin

  const currentDate = new Date().toISOString();
  console.log("current date:" + currentDate);
  const date = new Date();
  const trimDate1 = currentDate.slice(0, 11);
  const trimDate2 = currentDate.slice(16, 25);
  const currentHours = date.getHours() - 3;
  const currentMinutes = date.getMinutes();
  const endTime = trimDate1 + endHour + ":" + endMin + trimDate2;
  console.log("end date:" + endTime);

  const resetAll = () => {
    setCalendar();
    setTrigger();
    setConnected();
    setSummary();
    setRemainTime();
    setEndHour();
    setEndMin();
    console.log("reseted");
  };

  const resetTimer = () => {
    setCalendar();
    setTrigger();
    setRemainTime();
    setEndHour();
    setEndMin();
    console.log("reseted");
  };

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId:
      "116079516670-s6ld2sgqf8o1uluihs6jsamog5nbakhm.apps.googleusercontent.com",
    iosClientId:
      "116079516670-mgcgbpepqmrh5ot42o3mt0ta7m5mp58m.apps.googleusercontent.com",
    expoClientId:
      "116079516670-aqjnii9b5ogubs408ks8i0vjr5j6p6ft.apps.googleusercontent.com",
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  useKeepAwake();

  //get accessToken from Google
  useEffect(() => {
    async function fetchData() {
      if (response?.type === "success") {
        setAccessToken(response.authentication.accessToken);
        if (accessToken) {
          let userInfoResponse = await fetch(
            "https://www.googleapis.com/userinfo/v2/me",
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          userInfoResponse.json().then((data) => {
            setUserInfo(data);
          });
        }
      }
    }
    fetchData();
  }, [response, accessToken]);

  //click to signin to Google
  const GoogleSign = () => {
    return (
      <>
        <View>
          <Pressable
            style={styles.button}
            disabled={userInfo ? true : false}
            onPress={() => {
              promptAsync();
            }}
          >
            <Text style={styles.buttonText}>
              {userInfo ? "" : "Connect Calendar"}
            </Text>
          </Pressable>
          <Text style={styles.smallText}>
            {userInfo ? userInfo.email : null}
          </Text>
          <Pressable
            style={styles.button}
            disabled={accessToken == null ? true : false}
            onPress={() => setUserInfo()}
          >
            <Text style={styles.buttonText}>
              {userInfo == null ? "" : "Logout"}
            </Text>
          </Pressable>
          {/*           <Pressable style={styles.button} onPress={""}>
            <Text style={styles.buttonText}>getLocalValue</Text>
          </Pressable> */}
        </View>
      </>
    );
  };

  useEffect(() => {
    async function fetchData() {
      try {
        if (calendar && userInfo && summary) {
          let userCalendarResponse = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${userInfo.email}/events`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
              },
              body: JSON.stringify({
                summary: summary,
                end: {
                  dateTime: endTime,
                },
                start: {
                  dateTime: currentDate,
                },
              }),
            }
          );
          userCalendarResponse.json().then((data) => {
            console.log(data);
            if (data.status === "confirmed") {
              console.log("sent end date:" + data);
              setConnected(true);
            }
          });
        }
      } catch (error) {
        console.log(error);
      }
    }
    fetchData();
  }, [calendar, userInfo]);

  //Quotes later
  /*   const Quotes = () => {
    const quotes = [
      "With self awareness we can respond but without self awareness we just react",
      "Life begins at the end of your comfort zone",
      "The biggest obstacle to any transformation is literally just the way we’ve always done things",
    ];

    let random = Math.floor(Math.random() * 3);

    return (
      <>
        <Text style={styles.text}>{quotes[random]}</Text>
      </>
    );
  }; */

  const calculateEndTime = () => {
    if (currentMinutes + remainTime > 59) {
      setEndHour(currentHours + 1);
      setEndMin(currentMinutes + remainTime - 60);
    } else {
      setEndHour(currentHours);
      setEndMin(currentMinutes + remainTime);
    }
    if (endMin < 10) {
      return setEndMin(String(endMin).padStart(2, 0));
    }
  };

  const CountDown = () => {
    const [minutes, setMinutes] = useState(0);
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
      if (userInfo && !summary) {
        resetTimer();
        //eger login olduysan ancak summaryin yoksa butona tiklandiginda resetle, bu logini kontrol ediyor
      }
      if (trigger) {
        setSeconds(59);
        setMinutes(remainTime - 1);
        calculateEndTime();
        setCalendar(true);
      }
    }, [trigger]);

    useEffect(() => {
      const interval = BackgroundTimer.setInterval(() => {
        if (seconds === 0) {
          if (minutes !== 0) {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
      //needs a cleanup function
      return () => BackgroundTimer.clearInterval(interval);
    }, [seconds]);

    //make seconds double numeric
    const Seconds = (props) => {
      return String(props.second).padStart(2, "0");
    };
    const [customTime, setCustomTime] = useState("");

    return (
      <>
        <View style={styles.row}>
          <TextInput
            style={styles.buttonText}
            placeholder="Custom "
            placeholderTextColor="#0079ff"
            keyboardType="number-pad"
            maxLength={2}
            returnKeyType={"done"}
            onChangeText={setCustomTime}
            onSubmitEditing={() => {
              resetTimer();
              setRemainTime(Number(customTime));
              setTrigger(true);
            }}
          ></TextInput>
          <Pressable
            style={styles.button}
            onPress={() => {
              resetTimer();
              setRemainTime(30);
              setTrigger(true);
            }}
          >
            <Text style={styles.buttonText}>30 min</Text>
          </Pressable>
          <Pressable
            style={styles.button}
            onPress={() => {
              resetTimer();
              setRemainTime(45);
              setTrigger(true);
            }}
          >
            <Text style={styles.buttonText}>45 min</Text>
          </Pressable>
          <Pressable
            style={styles.button}
            onPress={() => {
              resetTimer();
              setRemainTime(60);
              setTrigger(true);
            }}
          >
            <Text style={styles.buttonText}>60 min</Text>
          </Pressable>
        </View>
        <View style={styles.row}>
          <Text style={styles.countdown}>
            {minutes}
            :
            <Seconds second={seconds} />
          </Text>
        </View>
        <Pressable style={styles.button} onPress={() => resetAll()}>
          <Text style={styles.buttonText}>Reset</Text>
        </Pressable>
      </>
    );
  };

  const OnBoarding = () => {
    /*     const [keyboardStatus, setKeyboardStatus] = useState("");

    const _keyboardDidShow = () => setKeyboardStatus("Keyboard Shown");
    //keyboard focus olursa yapalim bunu mesela
    useEffect(() => {
      Keyboard.addListener("keyboardDidShow", _keyboardDidShow);

      // cleanup function
      return () => {
        Keyboard.removeListener("keyboardDidShow", _keyboardDidShow);
      };
    }, []); */

    if (!summary) {
      return (
        <>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "space-between",
            }}
          >
            <Text style={styles.smallText}>Enter Your Text Below</Text>
            <Image
              style={{
                width: 20,
                height: 20,
                marginLeft: 10,
              }}
              source={require("./assets/arrow.gif")}
            />
          </View>
        </>
      );
    } else return null;
  };

  const Input = () => {
    const [input, setInput] = useState("");
    return (
      <>
        <View style={styles.inputFrame}>
          <TextInput
            style={styles.inputLine}
            placeholder={summary ? summary : "What Are You Doing?"}
            placeholderTextColor="#17D4FE"
            maxLength={40}
            keyboardType="default"
            returnKeyType={"done"}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => {
              setSummary(input);
            }}
          ></TextInput>
        </View>
      </>
    );
  };

  const CheckSteps = () => {
    if (!accessToken) {
      return (
        <View style={styles.infoBar}>
          <Text style={styles.smallText}>
            Send Time Data to Your Google Calendar{" "}
          </Text>
        </View>
      );
    }
    if (!summary) {
      return (
        <View style={styles.infoBar}>
          <Text style={styles.smallText}>
            {summary ? "Select Time" : "First Enter Your Task Name"}
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.infoBar}>
        <Text style={styles.smallText}>
          {connected ? "Success, Check Calendar" : "Now Must Select Timer"}
        </Text>
      </View>
    );
  };

  const [font] = useFonts({
    Orbitron: require("./assets/orbitron-regular.ttf"),
  });

  if (!font) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <OnBoarding />
      <Input />
      <CountDown />
      <CheckSteps />
      <GoogleSign />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 20,
  },
  countdown: {
    color: "#17D4FE",
    fontSize: 40,
    fontFamily: "Orbitron",
    letterSpacing: 7,
  },
  text: {
    color: "#17D4FE",
    fontSize: 20,
    letterSpacing: 7,
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    margin: 20,
  },
  smallText: {
    color: "#17D4FE",
    fontSize: 15,
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  buttonText: {
    color: "#0079ff",
    fontSize: 20,
  },
  inputArea: {
    width: "135%",
  },
  inputFrame: {
    /*     backgroundColor: "#111111", */
    padding: 7,
    margin: 10,
  },
  infoBar: {
    /*     backgroundColor: "#111111", */
    margin: 10,
    padding: 7,
  },
  inputLine: {
    color: "#17D4FE",
    fontSize: 20,
    letterSpacing: 7,
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
  },
});
