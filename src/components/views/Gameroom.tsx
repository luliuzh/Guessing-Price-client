import React, { useState, useEffect, useRef} from "react";
import { api, handleError } from "helpers/api";
import { Button } from "components/ui/Button";
import "styles/views/GameRoom.scss";
import {useNavigate} from "react-router-dom";

const GameRoom = () => {

  const [sliderValue, setSliderValue] = useState<number>(0);
  const sliderRef = useRef<HTMLInputElement>(null);
  const roomId = localStorage.getItem("roomId");
  const [imageUrl, setImageUrl] = useState<string>(`${process.env.PUBLIC_URL}/loading.png`);
  let roundNumber = Number(localStorage.getItem("roundNumber"));
  const [Min, setMin] = useState<number>(0);
  const [Max, setMax] = useState<number>(1000);
  const userId = localStorage.getItem("userId");
  // const [chosenItemList, setChosenItemList] = useState<string>("");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const roomCode = localStorage.getItem("roomCode");
  const [message_1, setMessage_1] = useState("");

  // gain item picture ui
  useEffect(() => {
    const initializeGame = async () => {
      await fetchImageUrl(roomId, roundNumber);
    };

    initializeGame();
  }, [roomId, userId, roundNumber]);

  const fetchImageUrl = async (roomId, roundNumber, retryCount = 0) => {
    try {
      const response = await api.get(`games/${roomId}/${roundNumber}/${userId}`);
      localStorage.setItem("questionId", response.data.id);
      const newImageUrl = response.data.blur ? `${process.env.PUBLIC_URL}/mosaic.jpg` : response.data.itemImage;
      setImageUrl(newImageUrl);
      setSliderRange(response.data.leftRange, response.data.rightRange);
      console.log("check:", newImageUrl, imageUrl, Min, Max);
    } catch (error) {
      console.error("Error fetching image URL:", error);
      if (error.response && error.response.status === 404 && retryCount < 2) {
        console.log(`Retry fetching image URL due to 404 error, retry count: ${retryCount + 1}`);
        setTimeout(() => fetchImageUrl(roomId, roundNumber, retryCount + 1), 1000); // Retry after 1 second
      } else if (retryCount >= 2) {
        console.error("Max retry limit reached, not retrying further.");
      }
    }
  };

  const setSliderRange = (min: number, max: number) => {
    setMin(min);
    setMax(max);
  };

  // bar
  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setSliderValue(Number(event.target.value));
    updateLabelPosition(event.target);
  };

  // pointed value

  const updateLabelPosition = (slider: HTMLInputElement) => {
    const value = Number(slider.value);
    // Use state values for min and max
    const max = Max;
    const min = Min;
    const percentage = ((value - min) / (max - min)) * 100;
    const newPosition = percentage * (slider.offsetWidth - 16) / 100;//-16 or -8
    /**
         setLabelStyle({
         position: "absolute",
         left: `${newPosition}px`,
         transform: "translateX(-50%)",
         marginTop: "-25px",
         marginLeft:"450px"
         });*/
  };

  // sent user choice
  const handleConfirmClick = async () => {
    try {
      const questionId = localStorage.getItem("questionId");
      setImageUrl(`${process.env.PUBLIC_URL}/loading.png`);
      setIsConfirmed(true);
      setMessage_1("Confirmation successful!");
      const result = await api.post("/answers/guessMode", {
        questionId,
        userId,
        guessedPrice: sliderValue,
        // chosenItemList,
      });
      console.log("Success:", result.data);
    } catch (error) {
      console.error("Error posting value", error);
      setMessage_1("Failed to confirm!");
    }

  };

  // Tool display
  const [tools, setTools] = useState([]);

  // fetch user"s tool list from backend
  // useEffect(() => {
  //     const fetchTools = async () => {
  //         try {
  //             const response = await api.get(`/tools/{userId}`);
  //             setTools(response.data);
  //         } catch (error) {
  //             console.error("Error fetching tools:", error);
  //         }
  //     };
  //
  //     fetchTools();
  // }, [userId]);

  // simulate fetch user's tool list from backend
  useEffect(() => {
    const fetchUserTools = async () => {
      try {
        const userToolsFromBackend = [
          { id: 1, toolType: "BLUR" },
          { id: 2, toolType: "HINT" }
        ];
        setTools(userToolsFromBackend);
      } catch (error) {
        console.error("Error fetching user tools:", error);
      }
    };

    fetchUserTools();
  }, []);


  // display Tools in the game screen
  const displayTool = (tool, index) => {
    if (!tool) {
      return (
        <div key={`default-${index}`} className="tool item default"></div>
      );
    }

    const { id, toolType } = tool;

    let toolClassName = "tool item default";
    let toolContent = "";

    if (toolType === "HINT") {
      toolClassName = "tool item hint";
      toolContent = "Hint";
    } else if (toolType === "BLUR") {
      toolClassName = "tool item bomb";
      toolContent = "Blur";
    }

    return (
      <div key={id} className={toolClassName}>
        {toolContent}
      </div>
    );
  };

  // making array to render tools, ensure the length is 3
  const renderTools = () => {
    const displayedTools = tools.slice(0, 3); // display the first three tools from tool list in the slot
    const emptySlotsCount = Math.max(3 - displayedTools.length, 0); // calculate the empty slot

    return [
      ...displayedTools.map((tool, index) => displayTool(tool, index)),
      ...Array(emptySlotsCount).fill(null).map((_, index) => displayTool(null, displayedTools.length + index))
    ];
  };

  // point display
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(20);
  const [message, setMessage] = useState({ text: "", type: "" });

  const [player, setPlayer] = useState("");

  // fetch current user data
  //useEffect(() => {
  //  const timer = setInterval(async () => {
  //    try {
  //      const response = await api.get(`/users/${userId}`);
  //      setPlayer(response.data);
  //      console.log("User data fetched successfully:", response.data);
  //    } catch (error) {
  //      console.error(`Something went wrong while fetching the user: \n${handleError(error)}`);
  //    }
  //  }, 100);
  //
  //  return () => clearInterval(timer);
  //}, [userId]);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await api.get(`/users/${userId}`);
        setPlayer(response.data);
        console.log("User data fetched successfully:", response.data);
      } catch (error) {
        console.error(`Something went wrong while fetching the user: \n${handleError(error)}`);
      }
    }
    fetchUser();
  }, [userId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    if (timeLeft === 0) {
      clearTimeout(timer);
      if (!isConfirmed) {
        handleConfirmClick()
          .then(() => {
            // after auto-handleConfirmClick
            if (roundNumber === 3) {
              navigate("/rank");
            } else {
              roundNumber += 1;
              localStorage.setItem("roundNumber", String(roundNumber));
              navigate("/shop");
            }
          })
          .catch((error) => {
            console.error("Failed to auto-confirm:", error);
            // handle error
          });
      } else {
        // if already clicked confirm
        if (roundNumber === 3) {
          navigate("/rank");
        } else {
          roundNumber += 1;
          localStorage.setItem("roundNumber", String(roundNumber));
          navigate("/shop");
        }
      }
    }

    return () => clearTimeout(timer);
  }, [timeLeft, isConfirmed, roundNumber]); // dependency

  //rank
  //const [rankData, setRankData] = useState([]);
  //useEffect(() => {
  //  const timer_rank = setInterval(async () => {
  //    try {
  //      const response_rank = await api.get(`/rooms/${roomId}/rank`);
  //      setRankData(response_rank.data);
  //    } catch (error) {
  //      console.error("Error fetching points", error);
  //    }
  //  }, 100);
  //
  //  return () => clearInterval(timer_rank);
  //}, []);
  const [rankData, setRankData] = useState([]);
  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const response_rank = await api.get(`/rooms/${roomId}/rank`);
        setRankData(response_rank.data);
      } catch (error) {
        console.error("Error fetching points", error);
      }
    };
    fetchPoints();
  }, []);
  const sortedRankData = rankData.sort((a, b) => b.score - a.score);
  const pointList = [];
  for (let i = 0; i < sortedRankData.length; i++) {
    const item = sortedRankData[i];
    pointList.push(
      <div className="score-table" key={i}>
        &nbsp;&nbsp;&nbsp;&nbsp;{item.username}: points: {item.score}
      </div>
    );
  }


  return (
    <div className="gameRoom">
      <div className="gameRoomContainer">

        {/*image part*/}
        <div className="image">
          <img src={imageUrl} alt="Item display" className="gameRoomImage"/>

          <div className="text">
                        Slide to choose the price <br/>
          </div>

          <div className="text">{sliderValue}</div>

          <div className="sliderWrapper">
            <div className="minValue">{Min}CHF</div>
            <input
              type="range"
              min={Min}
              max={Max}
              value={sliderValue}
              onChange={handleSliderChange}
              className="rangeInput"
              ref={sliderRef}
            />
            <div className="maxValue">{Max}CHF</div>
          </div>

          <div className="buttonsContainer">
            {/*<Button width="150%" onClick={handleStart}>START</Button>*/}
            <Button width="150%" >Room: {roomCode} </Button>
            <Button width="150%" onClick={handleConfirmClick}>Confirm</Button>
            {message && <div>{message_1}</div>}
          </div>


          {pointList}


        </div>

        {/*tool part*/}
        <div className="tool">
          <div className="tool display">
            <label className="tool label">Tools</label>
            <div className="tool container">
              {renderTools()}
            </div>
          </div>
        </div>


        {/* Display remaining time */}
        <div className="label" style={{left: 100}}>
                      Time: <br/>
          {timeLeft}
        </div>

        {/* Display Points */}
        <div className="label" style={{right: 100}}>
                      Your Point: <br/>
          {player.score}
        </div>

        {/*round display*/}
        <div className="label" style={{center: 0, color: "white"}}>
                       Round:
           {roundNumber}
        </div>

      </div>

    </div>
  );
};

export default GameRoom;
