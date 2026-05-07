/**
 * 与 defaultResults.animalKey 对应；资源使用纯英文文件名，避免旧版 canvas drawImage
 * 在部分真机上对中文路径 / 包内路径解码失败（仅显示灰底圆角占位）。
 */
const PET_IMAGE_BY_KEY = {
  golden: "/images/pet/golden.jpg",
  shiba: "/images/pet/shiba.jpg",
  borderCollie: "/images/pet/borderCollie.jpg",
  samoyed: "/images/pet/samoyed.jpg",
  ragdoll: "/images/pet/ragdoll.jpg",
  britishShorthair: "/images/pet/britishShorthair.jpg",
  orangeCat: "/images/pet/orangeCat.jpg",
  rabbit: "/images/pet/rabbit.jpg",
  deer: "/images/pet/deer.jpg",
  fox: "/images/pet/fox.jpg"
};

function resolvePetImageUrl(hit) {
  if (!hit || !hit.animalKey) return "";
  return PET_IMAGE_BY_KEY[hit.animalKey] || hit.imageUrl || "";
}

Page({
  data: {
    loading: true,
    result: {
      animalKey: "golden",
      title: "金毛系·阳光治愈犬",
      tags: ["阳光", "治愈", "共情强"],
      desc: "你像金毛一样温暖开朗，能快速感染身边气氛。面对压力时，你更倾向于积极行动，也愿意给朋友稳定的支持与陪伴。",
      imageUrl: PET_IMAGE_BY_KEY.golden
    }
  },

  onLoad(options) {
    const resultKey = options.resultKey || "golden";
    this.loadResult(resultKey);
  },

  async loadResult(resultKey) {
    this.setData({ loading: true });
    try {
      const resp = await wx.cloud.callFunction({
        name: "quickstartFunctions",
        data: { type: "getResults" }
      });
      const list = (resp.result && resp.result.data) || [];
      const hit = list.find((item) => item.animalKey === resultKey) || list[0];
      if (hit) {
        const imageUrl = resolvePetImageUrl(hit);
        this.setData({ result: { ...hit, imageUrl } });
      }
    } catch (err) {
      wx.showToast({ title: "结果加载失败", icon: "none" });
      console.warn("loadResult failed", err);
    } finally {
      this.setData({ loading: false });
    }
  },

  onShareAppMessage() {
    return {
      title: `我测出了${this.data.result.title}，你也来试试吧！`,
      path: "/pages/index/index"
    };
  },

  onShareTimeline() {
    return {
      title: `我测出了${this.data.result.title}，你也来试试吧！`
    };
  },

  onSavePoster() {
    const { result } = this.data;
    const imageSrc = result.imageUrl || "";

    const finish = (imagePath, imgW, imgH) => {
      this.drawPosterToCanvas(result, imagePath, imgW, imgH);
    };

    if (!imageSrc) {
      finish("", 0, 0);
      return;
    }

    wx.getImageInfo({
      src: imageSrc,
      success: (info) => {
        const tmpPath = `${wx.env.USER_DATA_PATH}/poster_pet.jpg`;
        try {
          wx.getFileSystemManager().copyFileSync(info.path, tmpPath);
          finish(tmpPath, info.width, info.height);
        } catch (e) {
          console.warn("poster copyFileSync fallback to package path", e);
          finish(info.path, info.width, info.height);
        }
      },
      fail: (err) => {
        console.warn("getImageInfo failed", err);
        finish("", 0, 0);
      }
    });
  },

  drawPosterToCanvas(result, imagePath, imgW, imgH) {
    const ctx = wx.createCanvasContext("posterCanvas", this);
    const width = 600;
    const height = 960;
    const pad = 40;
    const innerW = width - pad * 2;

    const roundRectPath = (x, y, w, h, r) => {
      const rr = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.lineTo(x + w - rr, y);
      ctx.arc(x + w - rr, y + rr, rr, -Math.PI / 2, 0);
      ctx.lineTo(x + w, y + h - rr);
      ctx.arc(x + w - rr, y + h - rr, rr, 0, Math.PI / 2);
      ctx.lineTo(x + rr, y + h);
      ctx.arc(x + rr, y + h - rr, rr, Math.PI / 2, Math.PI);
      ctx.lineTo(x, y + rr);
      ctx.arc(x + rr, y + rr, rr, Math.PI, (Math.PI * 3) / 2);
      ctx.closePath();
    };

    ctx.setFillStyle("#fff7f2");
    ctx.fillRect(0, 0, width, height);

    ctx.setFillStyle("#fdeee8");
    ctx.fillRect(0, 0, width, 118);

    ctx.setFillStyle("#1d2939");
    ctx.setFontSize(32);
    ctx.fillText("宠物动物系性格测试", pad, 62);

    ctx.setFillStyle("#98a2b3");
    ctx.setFontSize(22);
    ctx.fillText("你的专属动物人格", pad, 98);

    const imgBox = { x: pad, y: 146, w: innerW, h: 280 };
    let bodyTop = imgBox.y + imgBox.h + 57;

    if (imagePath && imgW > 0 && imgH > 0) {
      /* 暖灰衬底，与整页 #fff7f2 / #fdeee8 一致，避免冷色 #f2f4f7 夹在中间发蓝 */
      ctx.setFillStyle("#fff7f2");
      roundRectPath(imgBox.x, imgBox.y, imgBox.w, imgBox.h, 20);
      ctx.fill();

      ctx.save();
      roundRectPath(imgBox.x, imgBox.y, imgBox.w, imgBox.h, 20);
      ctx.clip();

      const scale = Math.min(imgBox.w / imgW, imgBox.h / imgH);
      const dw = imgW * scale;
      const dh = imgH * scale;
      const dx = imgBox.x + (imgBox.w - dw) / 2;
      const dy = imgBox.y + (imgBox.h - dh) / 2;
      ctx.drawImage(imagePath, dx, dy, dw, dh);
      ctx.restore();

      // ctx.setStrokeStyle("rgba(181, 71, 8, 0.15)");
      // ctx.setLineWidth(2);
      // roundRectPath(imgBox.x, imgBox.y, imgBox.w, imgBox.h, 20);
      // ctx.stroke();
    } else {
      bodyTop = 154;
    }

    ctx.setFillStyle("#ff7a45");
    ctx.setFontSize(38);
    ctx.fillText(result.title || "测试结果", pad, bodyTop);

    ctx.setFillStyle("#344054");
    ctx.setFontSize(26);
    const tags = result.tags || [];
    const tagY = bodyTop + 44;
    const tagColW = 172;
    tags.forEach((tag, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      ctx.fillText(`#${tag}`, pad + col * tagColW, tagY + row * 36);
    });

    ctx.setFillStyle("#475467");
    ctx.setFontSize(26);
    const text = result.desc || "";
    const lines = this.wrapTextByWidth(ctx, text, innerW);
    const tagRows = tags.length === 0 ? 0 : Math.ceil(tags.length / 3);
    const descTop = tagY + (tagRows ? tagRows * 36 + 20 : 8);
    const lineStep = 42;
    const maxDescLines = imagePath && imgW > 0 ? 6 : 8;
    lines.slice(0, maxDescLines).forEach((line, idx) => {
      ctx.fillText(line, pad, descTop + idx * lineStep);
    });

    ctx.setFillStyle("#98a2b3");
    ctx.setFontSize(22);
    ctx.fillText("测试结果仅供参考·数据本地存储", pad, height - 36);

    ctx.draw(false, () => {
      // drawImage 解码略晚于 draw 回调时，立刻导出会丢图；延迟一帧再导出更稳
      setTimeout(() => {
        wx.canvasToTempFilePath(
          {
            canvasId: "posterCanvas",
            width,
            height,
            destWidth: width,
            destHeight: height,
            success: (res) => {
              wx.saveImageToPhotosAlbum({
                filePath: res.tempFilePath,
                success: () => {
                  wx.showToast({ title: "海报已保存", icon: "success" });
                },
                fail: () => {
                  wx.showToast({ title: "保存失败，请授权相册权限", icon: "none" });
                }
              }, this);
            },
            fail: (e) => {
              console.warn("canvasToTempFilePath failed", e);
              wx.showToast({ title: "海报生成失败", icon: "none" });
            }
          },
          this
        );
      }, 150);
    });
  },

  wrapTextByWidth(ctx, text, maxWidth) {
    if (!text) return [];
    const lines = [];
    let current = "";
    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i];
      const candidate = current + ch;
      if (ctx.measureText(candidate).width <= maxWidth) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        current = ch;
      }
    }
    if (current) lines.push(current);
    return lines;
  },

  onRetest() {
    wx.reLaunch({
      url: "/pages/index/index"
    });
  }
});
