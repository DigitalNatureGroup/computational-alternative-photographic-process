# Computational Alternative Process Project

[Web App (now unavailable)](https://digitalnaturegroup.github.io/computational-alternative-process/)

[Our Project Page](https://digitalnature.slis.tsukuba.ac.jp/2023/06/give-life-back-to-alternative-process/)

## Usage

(WIP)

## Development

### Server

```shell
# macOS (Apple Silicon)
cd server
python -m venv env
. env/bin/activate
pip install -r requirements.txt
python scripts/create_models.py
TF_USE_LEGACY_KERAS=True python -m uvicorn app:app --port 7860
```

### Client

If you use `http-server`:

```shell
npm i -g http-server
http-server . -p 8888
```

以降，以下のコードで動きます．

```shell
cd server
. env/bin/activate
TF_USE_LEGACY_KERAS=True python -m uvicorn app:app --port 7860
```

```shell
npm i -g http-server
http-server . -p 8888
```

### Updating Regression Model

You can update the linear regression model with your printed color patch photo.
Put your image file to `colorpatches/` with a name of the printed alternative process method (`cyanotype_{full,mono}.png`, `salt.png` or `platinum.png`).

Then create regression model with script:

```shell
python scripts/create_models.py
```

## Reference

```bibtex
@inproceedings{10.1145/3550340.3564219,
author = {Ozawa, Chinatsu and Yamamoto, Kenta and Izumi, Kazuya and Ochiai, Yoichi},
title = {Computational Alternative Photographic Process toward Sustainable Printing},
year = {2022},
isbn = {9781450394659},
publisher = {Association for Computing Machinery},
address = {New York, NY, USA},
url = {https://doi.org/10.1145/3550340.3564219},
doi = {10.1145/3550340.3564219},
booktitle = {SIGGRAPH Asia 2022 Technical Communications},
articleno = {19},
numpages = {4},
keywords = {Alternative Photographic Process, Cyanotype, Data-driven Simulation, Optimization},
location = {Daegu, Republic of Korea},
series = {SA '22}
}

@inproceedings{10.1145/3588029.3599735,
author = {Ozawa, Chinatsu and Yamamoto, Kenta and Izumi, Kazuya and Ochiai, Yoichi},
title = {Give Life Back to Alternative Process: Exploring Handmade Photographic Printing Experiments towards Digital Nature Ecosystem},
year = {2023},
isbn = {9798400701535},
publisher = {Association for Computing Machinery},
address = {New York, NY, USA},
url = {https://doi.org/10.1145/3588029.3599735},
doi = {10.1145/3588029.3599735},
booktitle = {ACM SIGGRAPH 2023 Labs},
articleno = {6},
numpages = {2},
keywords = {Alternative Photographic Process, Handmade Photography, Optimization, Simulation},
location = {Los Angeles, CA, USA},
series = {SIGGRAPH '23}
}

@inproceedings{10.1145/3610591.3616430,
author = {Ozawa, Chinatsu and Yamamoto, Kenta and Izumi, Kazuya and Ochiai, Yoichi},
title = {Alternative Photographic Processes Reimagined: The Role of Digital Technology in Revitalizing Classic Printing Techniques},
year = {2023},
isbn = {9798400703201},
publisher = {Association for Computing Machinery},
address = {New York, NY, USA},
url = {https://doi.org/10.1145/3610591.3616430},
doi = {10.1145/3610591.3616430},
booktitle = {SIGGRAPH Asia 2023 Art Papers},
articleno = {2},
numpages = {9},
keywords = {Salt Print, Platinum Print, Optimization, Data-driven Simulation, Cyanotype, Alternative Photographic Processes},
location = {Sydney, NSW, Australia},
series = {SA '23}
}
```
