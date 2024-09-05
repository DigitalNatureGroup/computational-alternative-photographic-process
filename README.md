# Computational Alternative Process Project

[Web App](https://digitalnaturegroup.github.io/computational-alternative-process/)

[Our Project Page](https://digitalnature.slis.tsukuba.ac.jp/2023/06/give-life-back-to-alternative-process/)

## Usage

(WIP)

## Development

ターミナルを2つ開きます．

### Server

```shell
# macOS (Apple Silicon)
cd server
python -m venv env
. env/bin/activate
pip install -r requirements.macos.txt
python scripts/create_models.py
python -m uvicorn app:app --port 7860
```

### Client

If you use `http-server`:

```shell
npm i -g http-server
http-server . -p 8888
```

### Creating Regression Model

You can create the linear regression model with your printed color patch photo.
Put your image file to `colorpatches/` with a name of the printed alternative process method (`cyanotype_{full,mono}.png`, `salt.png` or `platinum.png`).

Then create regression model with script:

```shell
python scripts/create_models.py
```

## Papers

(WIP)
