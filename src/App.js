import './App.css';
import {GeoObject, Map, Placemark, YMaps} from "react-yandex-maps";
import {useEffect, useReducer, useState} from "react";
import axios from "axios";

const apiKey = 'e5196280-677f-4894-825b-9e2cf04decf8'
const initialState = [];

function reducer(state, action) {
    switch (action.type) {
        case 'addAddress':
            return [
                ...state,
                {
                    id: state.length == 0 ? 1 : state[state.length-1].order+1,
                    order: state.length == 0 ? 1 : state[state.length-1].order+1,
                    address: action.payload.Address,
                    pos: action.payload.pos
                }
            ]
        case 'delAddress':
            return  [...state.filter((item)=>item.id !== action.payload.id)]
        case 'editID':
            return  [...state.map((item)=>{
                if(item.id == action.payload.id){
                    item.order = action.payload.order
                }
                return item
            })]
        case 'placemarkMoveAddress':
            return  [
                ...state.map((item)=>{
                    if(item.id == action.payload.id){
                        item.address = action.payload.address
                        item.pos =  action.payload.pos
                    }
                    return item
                })
            ]
        default:
            throw new Error();
    }
}


function App() {
    const [cordinates, setCordinates] = useState('')
    const [corPlacemarkMove, setCorPlacemarkMove] = useState('')
    const [input, setInput] = useState('')
    const [list, setList] = useState('')
    const [startID, setStartID] =useState()
    const [state, dispatch] = useReducer(reducer, initialState);


    const inAddress = (e) => {
        setInput(e.target.value)
    }
    const EntAddress = (e) => {
        if(e.key === 'Enter'){
            setCordinates(input)
        }
    }
   const Click = (e) => {
       setCordinates(e.get('coords'))
   }
   const PlacemarkMove = (e, id) => {
       let coord = e.originalEvent.target.geometry._coordinates
       setCorPlacemarkMove({coord: coord, id: id})
   }
   useEffect(async ()=>{
       const url = 'https://geocode-maps.yandex.ru/1.x/'
       try {
           if(corPlacemarkMove.coord){
               console.log(corPlacemarkMove)
               let cordinat = `${corPlacemarkMove.coord[1]},${corPlacemarkMove.coord[0]}`
               const response = await axios.get(url+`?geocode=${cordinat}&apikey=${apiKey}&format=json`);
               let textAddress = response.data.response.GeoObjectCollection.featureMember[0].GeoObject.metaDataProperty.GeocoderMetaData.text
               let pos = (response.data.response.GeoObjectCollection.featureMember[0].GeoObject.Point.pos).split(' ').reverse()
               dispatch({type:'placemarkMoveAddress', payload: {id: corPlacemarkMove.id, address: textAddress, pos: pos}})
           }
       } catch (error) {
           console.error(error);
       }
   },[corPlacemarkMove])


   useEffect(async ()=>{
       const url = 'https://geocode-maps.yandex.ru/1.x/'
       let cordinat = typeof cordinates === "object"? `${cordinates[1]},${cordinates[0]}` : cordinates
       try {
           if(cordinates){
               const response = await axios.get(url+`?geocode=${cordinat}&apikey=${apiKey}&format=json&lang=ru_RU`);
               let textAddress = response.data.response.GeoObjectCollection.featureMember[0].GeoObject.metaDataProperty.GeocoderMetaData.text
               let pos = (response.data.response.GeoObjectCollection.featureMember[0].GeoObject.Point.pos).split(' ').reverse()
               setCorPlacemarkMove(pos)
               dispatch({type:'addAddress', payload: {Address: textAddress, pos: pos}})
               setInput('')
           }
       } catch (error) {
           console.error(error);
       }
   },[cordinates])


    useEffect(()=>{
        let cordianat = []
        let sortData = state.sort((a, b)=>a.order-b.order)
        sortData.map((item)=>{
            cordianat.push(item.pos)
        })
        setList(cordianat)
    },[state])

    const delAddress = (id) => {
        dispatch({type:'delAddress', payload: {id: id}})
    }



    const onDragOver = (e) => {
        e.preventDefault()
    }
    function onDrop(e, data) {
        e.preventDefault()
        console.log('onDroporder', data.order)//1 12
        console.log('startID', startID)//2
        dispatch({type:'editID', payload: {id: startID.id, order: data.order}})
        dispatch({type:'editID', payload: {id: data.id, order: startID.order}})
    }
    function onDragStart(e, data) {
        setStartID({id: data.id, order: data.order})
    }

    return (
    <div className="App">
        <div className='block_address'>
            <div className='input_search'>
                <input value={input} onChange={inAddress} onKeyUp={EntAddress} placeholder='Введите адрес'/>
            </div>
            <div >
                {state.map((data)=>{
                    return <div draggable={true}
                                onDragOver={e => onDragOver(e)}
                                onDrop={e => onDrop(e, data)}
                                onDragStart={e => onDragStart(e, data)}
                                key={data.id}
                                className='address'
                    ><span>№{data.id}: {data.address}</span><button onClick={()=>delAddress(data.id)}>X</button> </div>
                })}
            </div>
        </div>
      <YMaps >
          <Map defaultState={{center:[55.700271813393776, 37.60943164453113], zoom: 10}}
               onClick={Click}
               height={465}
               width="100%" >
              { state.map((data)=>{
                  return <Placemark geometry={data.pos} key={data.id}
                                    options={{draggable: true}}
                                    onDragend={(e)=>PlacemarkMove(e, data.id)}
                                    properties={{
                                        balloonContent: `<div class="baloon-content">${data.address}</div>`
                                    }}
                                    modules={["geoObject.addon.balloon"]}
                  />
                  })
              }
              <GeoObject
                  geometry={{
                      type: 'LineString',
                      coordinates: list,
                  }}
                  options={{
                      strokeWidth: 5,
                      strokeColor: '#0000FF',
                  }}
              />
          </Map>
      </YMaps>
    </div>
  );
}

export default App;
