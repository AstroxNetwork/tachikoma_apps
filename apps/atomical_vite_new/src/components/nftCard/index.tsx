import { IAtomicalItem } from "@/interfaces/api";
import { returnImageType } from "@/utils";
import { Checkbox, Tag } from "..";

type NFTCardProps = {
  data: IAtomicalItem;
  onClick?: (data: IAtomicalItem) => void;
  selectvalues?: string[];
  checkbox?: boolean;
};

const NFTCard: React.FC<NFTCardProps> = (props) => {
  const { data, checkbox, onClick, selectvalues } = props;
  const { type, content, tag } = returnImageType(data);
  console.log("Card", selectvalues);
  return (
    <>
      <div
        className="flex flex-col bg-card-bg basis-36 p-2 rounded-md"
        onClick={() => onClick(data)}
      >
        <div className="flex justify-between w-full relative">
          <div className="text-primary flex-1"># {data.atomical_number}</div>
          {checkbox && (
            <div className="w-5 h-5 absolute right-0 top-0">
              <Checkbox
                // icon={(checked) => {
                //   if (checked) {
                //     return (
                //       <div className="h-4 w-4 rounded-full border border-gray-400">
                //         1
                //       </div>
                //     );
                //   } else {
                //     return (
                //       <div className="h-4 w-4 rounded-full border border-gray-400"></div>
                //     );
                //   }
                // }}
                value={`${data.atomical_id}`}
                checked={selectvalues?.includes(`${data.atomical_id}`)}
              />
            </div>
          )}
        </div>
        <div className="flex flex-col items-start justify-center">
          <div>
            {type === "nft" ? (
              <Tag className="text-xs" color="default">
                {tag}
              </Tag>
            ) : (
              <Tag className="text-xs" color="success">
                Realm
              </Tag>
            )}
          </div>
          <div className="flex justify-center w-full h-8">
            {type === "nft" ? (
              <img
                src={content}
                className="h-7 rounded-xl overflow-hidden"
                // style={{ objectFit: "cover" }}
                alt=""
              />
            ) : (
              <p className="text-body-color text-xl">{content}</p>
            )}
          </div>
          <p className="text-[10px]">{data.value} sats</p>
        </div>
      </div>
    </>
  );
};

export default NFTCard;
