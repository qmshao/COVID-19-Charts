/* global $ axios echarts build_timestamp getTextForKey getCurrentLang */
/* exported switchMapMetrics searchArea */

let isVertical = window.innerWidth / window.innerHeight < 0.8;
let resizeFunc = function () {
  const chart = echarts.init(document.getElementById('mapchart'));
  if (chart != null && chart != undefined) {
    let currVertical = window.innerWidth / window.innerHeight < 0.8;
    if (!currVertical && !isVertical){
      chart.resize();
    } else if (currVertical != isVertical){
      handleHashChanged();
    }
    isVertical = currVertical;
  }
};
window.addEventListener("resize", resizeFunc);

let colorSet = ['#c23531','#2f4554', '#61a0a8', '#d48265', '#91c7ae','#749f83',  '#ca8622', '#bda29a','#6e7074', '#546570', '#c4ccd3'];
let nameMap = {
  Alabama: "AL",
  Alaska: "AK",
  "American Samoa": "AS",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  "District of Columbia": "DC",
  "Federated States Of Micronesia": "FM",
  Florida: "FL",
  Georgia: "GA",
  Guam: "GU",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  "Marshall Islands": "MH",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  "Northern Mariana Islands": "MP",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Palau: "PW",
  Pennsylvania: "PA",
  "Puerto Rico": "PR",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  "Virgin Islands": "VI",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY"
};
let codeMap = state_hash = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  DC: "District Of Columbia",
  FL: "Florida",
  GA: "Georgia",
  GU: "Guam",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  PR: "Puerto Rico",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming"
};

let allDataStore = {};
// let mapDisplayMetrics = 'accum';

const mobulesConfig = {
  // 'summary': {
  //   func: showSummary,
  // },
  // 'zerodays': {
  //   func: showZeroDays,
  // },
  'map': {
    func: showMap,
    supportProvince: true,
  },
  'county-map': {
    func: showAllCountiesMap,
  },
  // 'world-map': {
  //   func: showWorldMap,
  // },
  // 'trends': {
  //   func: showProvince,
  //   supportProvince: true,
  // },
  'select-state': {
    func: showMap,
    stateKey: 'state',
    supportState: true,
  },
};


const allTabs = (() => {
  return [].slice.call(document.querySelectorAll('#navbar a.nav-link')).reduce((p, v) => {
    const tab = v.href.split('#')[1].split('=')[1];
    p[tab] = {
      tab,
      el: v,
      title: v.innerHTML.trim(),
    };
    return p;
  }, {});
})();

const todayStart = (() => {
  const today = new Date();
  today.setSeconds(0);
  today.setMinutes(0);
  today.setHours(0);
  today.setMinutes(480 + today.getTimezoneOffset());
  return today;
})();

let chartsContainerId = 'chart_container';
let allCharts = [];

const showLoading = (() => {
  const el = $('#' + chartsContainerId);
  let loading = null;
  return function (show = true, pe) {
    if (typeof show === 'string') {
      const progress = pe && pe.lengthComputable ? `${Math.ceil(pe.loaded/pe.total*100)}% ` : '';
      const msg = `Loading ${show} ${progress}...`;
      if (loading) {
        $('.loading-overlay-content', el.overlay).text(msg);
      } else {
        loading = el.loading({
          message: msg
        });
      }
    } else {
      if (show) {
        loading = el.loading({
          message: 'Loading ...'
        });
      } else {
        el.loading('stop');
        loading = null;
      }
    }
  };

})();

function getVisualPieces(type) {
  const visualPieces = type === 'country' ? [{
      min: 10000,
      label: '>10000',
      color: 'rgb(143,31,25)'
    },
    {
      min: 1000,
      max: 9999,
      label: '1000-9999',
      color: 'rgb(185,43,35)'
    },
    {
      min: 500,
      max: 999,
      label: '500-999',
      color: 'rgb(213,86,78)'
    },
    {
      min: 100,
      max: 499,
      label: '100-499',
      color: 'rgb(239,140,108)'
    },
    {
      min: 10,
      max: 99,
      label: '10-99',
      color: 'rgb(248,211,166)'
    },
    {
      min: 1,
      max: 9,
      label: '1-9',
      color: 'rgb(252,239,218)'
    },
  ] : type === 'us-states' ? [{
      min: 2000,
      label: '>2k',
      color: 'rgb(143,31,25)'
    },
    {
      min: 1000,
      max: 1999,
      label: '1k-2k',
      color: 'rgb(185,43,35)'
    },
    {
      min: 300,
      max: 999,
      label: '300-999',
      color: 'rgb(213,86,78)'
    },
    {
      min: 100,
      max: 299,
      label: '100-299',
      color: 'rgb(239,140,108)'
    },
    {
      min: 30,
      max: 99,
      label: '30-99',
      color: 'rgb(248,211,166)'
    },
    {
      min: 1,
      max: 29,
      label: '1-29',
      color: 'rgb(252,239,218)'
    },
  ] : [{
      min: 300,
      label: '>300',
      color: 'rgb(143,31,25)'
    },
    {
      min: 100,
      max: 299,
      label: '100-299',
      color: 'rgb(185,43,35)'
    },
    {
      min: 30,
      max: 99,
      label: '30-99',
      color: 'rgb(213,86,78)'
    },
    {
      min: 10,
      max: 29,
      label: '10-29',
      color: 'rgb(239,140,108)'
    },
    {
      min: 5,
      max: 9,
      label: '5-9',
      color: 'rgb(248,211,166)'
    },
    {
      min: 1,
      max: 4,
      label: '1-4',
      color: 'rgb(252,239,218)'
    },
  ];
  return visualPieces;
}

async function prepareChartMap(mapName) {
  let geoJSON = null;
  const isProvince = ['us-states', 'us-counties', 'world'].indexOf(mapName) === -1;

  if (!echarts.getMap(mapName)) {
    const url = `map/json/${isProvince ? 'state/' : ''}${mapName}.json`;
    geoJSON = (await axios.get(url, {
      onDownloadProgress: (pe) => {
        showLoading('map', pe);
      }
    })).data;
    echarts.registerMap(mapName, geoJSON, {
      Alaska: {
        left: -131,
        top: 25,
        width: 15
      },
      Hawaii: {
        left: -115,
        top: 26,
        width: 5
      },
      'Puerto Rico': {
        left: -76,
        top: 26,
        width: 2
      }
    });
  } else {
    geoJSON = echarts.getMap(mapName).geoJson;
  }
  return geoJSON;
}

async function getData(type) {
  if (!allDataStore[type]) {
    const t = typeof build_timestamp !== 'undefined' ? parseInt(build_timestamp) || 1 : 1;
    const ret = await axios.get(`by_${type}.json?t=${t}`, {
      onDownloadProgress: (pe) => {
        if (pe.lengthComputable) {
          showLoading('data', pe);
        }
      }
    });
    allDataStore[type] = ret.data;
  }

  return allDataStore[type];
}



async function createMapChartConfig({
  mapName,
  data,
  valueKey = 'confirmedCount'
}) {
  let geoJSON = await prepareChartMap(mapName);
  data = data.filter(d => parseInt(d.day[0]) >= 3);
  geoJSON.features.forEach(v => {
    const showName = v.properties.name;
    data.forEach(d => {
      d.records.forEach(r => {
        const name = r.name;
        if (name.substr(0, showName.length) === showName || showName.substr(0, name.length) === name) {
          r.showName = showName;
        }
      });
    });
  });

  const hideBarChart = (mapName === 'us-counties');
  const isStateMap = (mapName === 'us-states');
  const isCounty = ['us-states', 'us-counties', 'world'].indexOf(mapName) === -1;
  const visualPieces = getVisualPieces(mapName);
  const showTrend = isVertical && !hideBarChart;
  let dates = data.map(d => d.day);
  let trend = {'confirmed': data.map(d => d.confirmedCount), 'increased': data.map(d => d.confirmedIncreased)};
  let dateLen = dates.length;
  // get map aspec ratio
  let getboundary = (boundary, coord) => coord.reduce( (b,c) => 
     c[0].length?getboundary(b,c):[
    Math.min(b[0], c[0]),
    Math.max(b[1], c[0]),
    Math.min(b[2], c[1]),
    Math.max(b[3], c[1])
  ], boundary);

  let boundary = isStateMap?null:geoJSON.features.reduce((bound, feature) => getboundary(bound,feature.geometry.coordinates), [1000, -1000, 1000, -1000])
  let mapAspectRatio = isStateMap? 0.43885284252467566: (boundary[3] - boundary[2]) / (boundary[1] - boundary[0]);
  let isSlimMap = mapAspectRatio>window.innerHeight*(isVertical?0.4:0.8)/window.innerWidth

  let divider = 45;
  let center = 20;
  if (isStateMap && isVertical ){
    center = parseInt((window.innerWidth * mapAspectRatio * 0.5  ) / (window.innerHeight - 75)*100) ;
    divider = parseInt((window.innerWidth * mapAspectRatio * 1.0 + 30) / (window.innerHeight - 75)*100);
  }

  const barSeriesConfig = {
    stack: 'count',
    type: 'bar',
    label: {
      position: 'inside',
      show: true,
      color: '#eee',
      fontSize: (isVertical && isStateMap) ? 9-isStateMap*2 : null,
      formatter: ({
        data, seriesName
      }) => {
        return (data[0] > 0 ? (seriesName=='Confirmed Incr.'?'+':'') + data[0] : '');
      }
    },
    barMaxWidth: 30,
  };
  const config = {
    baseOption: {
      // title: {
      //   text: 'Something',
      //   target: 'self',
      //   bottom: '10',
      //   left: '10',
      // },
      timeline: {
        axisType: 'category',
        // realtime: false,
        // loop: false,
        autoPlay: false,
        currentIndex: data.length - 1,
        playInterval: 1000,
        // controlStyle: {
        //     position: 'left'
        // },
        data: data.map(d => d.day),
      },
      tooltip: {
        show: true,
        trigger: 'item',
      },
      // toolbox: {
      //   show: true,
      //   orient: 'vertical',
      //   left: 'right',
      //   top: 'center',
      //   feature: {
      //     dataView: {readOnly: false},
      //     restore: {},
      //     saveAsImage: {}
      //   }
      // },
      grid: hideBarChart ? [] : [{
        width: '100%',
        top: isVertical ? `${divider}%` : 10,
        bottom: isVertical ? '8%' : null,
        left: 10,
        containLabel: true
      }].concat (!showTrend? [] :[{
        // width: '50%',
        top: isVertical ? `${divider}%` : 10,
        bottom: isVertical ? '8%' : null,
        left: 10,
        show: false,
        containLabel: true,
      }]),
      xAxis: hideBarChart ? [] : [{
        type: 'value',
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          show: false,
        },
        splitLine: {
          show: false,
        },
        max: data.length ? data[data.length - 1].records.reduce((acc, cur) => Math.max(acc, cur.confirmedCount), 0) * 1.05 : 0,
      }].concat (!showTrend? [] :[{
        type: 'category',
        data: [...dates, ''],
        show: false,
      }]),
      yAxis: hideBarChart ? [] : [{
        type: 'category',
        axisLabel: {
          show: true,
          interval: 0,
          fontSize: (isVertical && isStateMap) ? 9 : null,
        },
        axisTick: {
          show: false,
        },
        axisLine: {
          show: false,
        },
      }].concat (!showTrend? [] :[{
        type: 'value',
        // axisLine: {show:false, lineStyle: {color:'grey'}},
        // axisTick : {show: false},
        // axisLabel: {align: 'left', fontSize: 9, formatter: (value, index) => `${parseInt(value/1000)}k`},
        // offset: -10,
        girdIndex: 1,
        show: false,
        max: trend.confirmed[dateLen-1]* 1.2,
      }]),
      visualMap: [{
          type: 'piecewise',
          pieces: visualPieces,
          left: 'auto',
          right: 30,
          bottom: isVertical&& !hideBarChart ? `${101-divider}%` : 100,
          seriesIndex: 0,
          orient: isVertical && !hideBarChart? 'horizontal' : 'vertical',
        },
        // {
        //   type: 'piecewise',
        //   pieces: visualPieces,
        //   dimension: 0,
        //   show: false,
        //   seriesIndex: 1,
        // },
      ],
      series: [{
        name: '',
        type: 'map',
        mapType: mapName,
        label: {
          show: !hideBarChart,
          formatter: !isStateMap ? (para => (para.data) ? para.name.slice(0, -4) : '') : {},
          // formatter: !isStateMap ? para => para.name.slice(0,-4) : {},
          fontSize: (isCounty || isVertical)? 9 - isVertical : 12,
        },
        // zoom: isCounty ? 0.9 : 1,
        left: isCounty && !isVertical? null: (hideBarChart || isVertical ? 'center' : '15%'),
        right: isCounty && !isVertical ? `${Math.max(100, window.innerWidth*0.1)}px` : null,
        // top: isVertical? 'auto':null,
        // bottom: isVertical? '60%':null,
        layoutCenter: isVertical ? ['50%', hideBarChart? '40%': `${center}%`] : null, 
        layoutSize: (isStateMap && isVertical)? window.innerWidth*0.8 : ((isSlimMap? window.innerHeight * 0.4 : window.innerWidth) * 0.8),
        tooltip: {
          formatter: ({
            name,
            data
          }) => {
            if (data) {
              const {
                name,
                /*value,*/
                confirmed,
                dead,
                increased
              } = data;
              const tip = `<b>${isStateMap?codeMap[name]:name}</b><br />${getTextForKey('确诊人数：')}${confirmed}<br />${getTextForKey('死亡人数：')}${dead}<br />${getTextForKey('新增确诊：')}${increased}`;
              return tip;
            }
            return `<b>${name}</b><br />${getTextForKey('暂无数据')}`;
          },
        },
        z: 1000,
      }].concat((hideBarChart ? [] : [{
        name: getTextForKey('确诊'),
        color: '#c23531',
      } ,
        {
        name: getTextForKey('新增确诊'),
        color: '#ef8b6c',
      },].map(c => {
        return Object.assign({}, barSeriesConfig, c);
      })))
    },
    options: data.map(d => {
      d.records.sort((a, b) => a.confirmedCount < b.confirmedCount ? -1 : 1);
      return {
        series: [{
          title: {
            text: d.day,
          },
          nameMap: isStateMap ? nameMap : {},
          data: d.records.map(r => {
            return {
              name: isStateMap ? nameMap[r.showName] : r.showName,
              province: r.name,
              value: r[valueKey],
              confirmed: r.confirmedCount,
              dead: r.deadCount,
              // cured: r.curedCount,
              increased: r.confirmedIncreased,
            };
          }),
        }, ].concat(hideBarChart ? [] : 
          [ 'confirmedCount', 'confirmedIncreased'].map(k => {
          return {
            encode: {x:0+(k=='confirmedCount'), y:2, tooltip:0},
            data: d.records.map(r => {
              let name = r.showName || r.name;
              let last = r['confirmedCount']-r['confirmedIncreased'];
              return [ r[k],  last, isStateMap ? name : name.slice(0, -4) ];
            })
          }})).concat(!showTrend? []:['confirmed', 'increased'].map( (k) => {
            return {
              type: 'line',
              name: k==='confirmed'?'Confimred':'Increased' ,
              symbol:  'circle',
              symbolSize: 6,
              // lineStyle: {color: '#b03a5b'},
              // lineStyle: {width: 1, color: '#b03a5b'},
              // color: 'rgb(255,0,0,0,0.1)',
              color: colorSet[k=='confirmed'?3:8], //#b92b23af',
              xAxisIndex : 1,
              yAxisIndex : 1,
              

              // areaStyle: {},
              // label: {show:true,position:'inside'},
              markPoint: { // markLine is in the same way.
                name: k==='confirmed'?'Confimred by Last Update':'Increased  by Last Update' ,
                label: {show: true, formatter: (para)=> para.data[0]},
                tooltip: `${k==='confirmed'?'Confimred by Last Update':'Increased  by Last Update' }<br />${trend[k][dateLen-1]}`,
                symbolSize: 10,
                symbol: 'circle',
                // symbolOffset: [0,'-50%'],
                data: [{
                    coord: [d.day, trend[k][dates.indexOf(d.day)]], // The number 5 represents xAxis.data[5], that is, '33'.
                    // coord: ['5', 33.4] // The string '5' represents the '5' in xAxis.data.
                }]
              },
              markLine:{
                type: 'dashed',
                silent: true,
                label: {offset:[10,10], position:'middle'},
                data: [
                  [{
                      name: k=='confirmed'?'Confimred':'Increased',
                      coord: [dates[dates.length-2], trend[k][dates.length-2]]
                  },
                  {
                      coord: [dates[dates.length-1], trend[k][dates.length-1]]
                  }]
                ],
              },
              data: trend[k].slice(0,-1),
            }
          }))
      };
    })
  };
  return config;
}

async function setupMapCharts(records, container, province = '', hideBarChart = false) {

  const mapName = province ? province : (hideBarChart ? "us-counties" : "us-states");
  const html = '<div id="mapchart" class="mychart" style="display:inline-block;width:100%;height:100%;"></div>';
  container.innerHTML = html;
  const cfg = await createMapChartConfig({
    mapName,
    data: records
  });
  const chart = echarts.init(document.getElementById('mapchart'));
  chart.setOption(cfg);

  if (!province) {
    chart.on('click', (para) => {
      let {name, componentType, componentIndex} = para;
      if ( !(["timeline", "markPoint"].includes(componentType)) && componentIndex<3)
        showMap(componentIndex?name:codeMap[name.slice(-2)]);
    });
  }

  return [chart];
}


async function prepareChartData(name, type = 'area') {
  showLoading();

  const dataList = await getData(type);
  // Prepare summary data
  if (Object.keys(summary).length ==0){
    summary.US = {confirmed:0, increased:0};
    dataList[dataList.length-1].records.forEach( r => {
      summary.US.confirmed +=  r.confirmedCount;
      summary.US.increased +=  r.confirmedIncreased;
      summary[nameMap[r.provinceName]] = {confirmed: r.confirmedCount, increased: r.confirmedIncreased};
    })
  }
  allCharts.forEach(c => {
    c.clear();
    c.dispose();
  });
  allCharts = [];

  document.getElementById(chartsContainerId).innerHTML = 'Loading...';

  let records = dataList;

  if (name) {
    if (type === 'area') {
      records = dataList.filter(v => v.name === name)[0].cityList;
    } else {
      records = dataList
        .filter(d => d.records.filter(p => p.name == name).length)
        .map(d => {
          let stateData = d.records.filter(p => p.name == name)[0];
          return {
            day: d.day,
            confirmedCount : stateData.confirmedCount,
            confirmedIncreased : stateData.confirmedIncreased,
            records: stateData.cityList,
          };
        });

    }
  }
  records.forEach(v => {
    v.showName = v.name;
  });

  return records;
}

function updateHash(tab, state, city) {
  updateNavtitle(state);
  const tabConfig = mobulesConfig[tab];
  let hash = '#tab=' + tab;
  Object.values(allTabs).forEach(t => {
    $(t.el)[t.tab == tab ? 'addClass' : 'removeClass']('active');
  });
  if (state) {
    hash += `&${tabConfig.stateKey || 'state'}=${encodeURIComponent(state)}`;
  }
  if (city) {
    hash += `&${tabConfig.cityKey || 'city'}=${encodeURIComponent(city)}`;
  }
  location.hash = hash;

  showLoading(false);
}


async function showWorldTrends(continent = '', country = '') {
  let records = await prepareChartData(name, 'world');
  if (continent) {
    records = records.filter(r => r.continentName === continent);
  }
  if (country) {
    records = records.filter(r => r.countryName === country);
  }
  allCharts = setupTrendsCharts(records, document.getElementById(chartsContainerId));
  updateHash('world-trends', continent, country);
}

async function showMap(name) {
  const records = await prepareChartData(name, 'date');
  allCharts = await setupMapCharts(records, document.getElementById(chartsContainerId), name);
  updateHash('map', name);
}


async function showAllCountiesMap() {
  const specialState = ['Alaska', 'Hawaii', 'Puerto Rico'];
  const data = await prepareChartData(name, 'date');
  const records = data.map(d => {
    return {
      day: d.day,
      records: d.records.reduce((p, v) => {
        return p.concat(specialState.indexOf(v.name) > -1 ? v : v.cityList);
      }, []),
    };
  });
  allCharts = await setupMapCharts(records, document.getElementById(chartsContainerId), '', true);
  updateHash('county-map');
}

async function showWorldMap() {
  const data = await prepareChartData('', 'country');
  allCharts = await setupWorldMapCharts(data, document.getElementById(chartsContainerId));
  updateHash('world-map');
}


// get confimred case summary
let summary = {}
let updateNavtitle = function(name){
  let navtitle = document.getElementById('navtitle');
  let code = name?nameMap[name]:'US';
  let confirmedStr = summary[code].confirmed.toString().padStart(5,'0');
  let increasedStr = summary[code].increased.toString().padStart(4,'0')
  navtitle.innerHTML = `<img src="assets/logo.png" width="30" height="30" class="d-inline-block align-center" alt="">COVID-19@${code}<div style="display:inline;color: red;font-size:small">&nbsp${confirmedStr}(+${increasedStr})</div>`
}



function handleHashChanged() {
  if (typeof $ !== 'undefined' && $('#navbarSupportedContent').collapse) {
    $('#navbarSupportedContent').collapse('hide');
  }

  const defaultTab = 'map';
  const query = new URLSearchParams(location.hash.replace(/^#/, ''));
  let tab = query.get('tab') || defaultTab;
  if (tab==='select-state') tab='map';
  let title = [document.querySelector('title').innerHTML.split(' - ')[0]];

  const func = mobulesConfig[tab] || mobulesConfig[defaultTab];

  const state = query.get(func.stateKey || 'state') || '';
  const city = query.get(func.cityKey || 'city') || '';

  func.func(state, city);
  title.push(allTabs[tab].title);
  if (func.supportState && state) {
    title.push(state);
  }

  document.querySelector('title').innerHTML = title.join(' - ');
}

async function searchArea() {
  const term = $('#searchField').val().trim().toLowerCase();
  if (term.length === 0) {
    $('#searchField').focus();
    return;
  }

  const data = await prepareChartData('', 'searchterm');
  const ret = data.filter(v => {
    return v.keywords.filter(k => {
      return k && k.toLowerCase().indexOf(term) > -1;
    }).length > 0;
  });

  if (ret.length > 0) {
    location.hash = ret[0].url + '&t=' + (new Date() * 1);
  }
}

const updatemenu = function(){
  let dropdown = document.getElementById('select-state');
  dropdown.innerHTML = Object.values(codeMap).filter(state => !(['Alaska', 'Hawaii', 'Puerto Rico'].includes(state)))
    .reduce((acc, state) => acc + `<a class="dropdown-item" href="#tab=select-state&amp;state=${state}">${state}</a>`, '');

  // Feedback
  $('#feedbackModal').on('shown.bs.modal', function () {
    $('#feedbackPath')[0].value = window.location.href;
  })
  $('#feedbackSubmit').click(function() {
    $('#feedbackModal').modal('hide');
    $("#feedbackSuccess").fadeTo(2000, 500).slideUp(500, function() {
      $("#feedbackSuccess").slideUp(500);
    });
 });

}

async function main() {
  handleHashChanged();
  window.onhashchange = handleHashChanged;
  window.onload = updatemenu;
}

main();