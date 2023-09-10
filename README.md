# Computational Alternative Process Project

[Web App](https://digitalnaturegroup.github.io/computational-alternative-process/)  
[Project Page](https://digitalnature.slis.tsukuba.ac.jp/2023/06/give-life-back-to-alternative-process/)

## Usage

(WIP)

## Development

### Server

```shell
cd server
pip install -r requirements.txt
uvicorn app:app --port 7860
```

### Client

If you use `http-server`:

```shell
npm i http-server
http-server .
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
